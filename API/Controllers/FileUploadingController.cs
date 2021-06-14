using SistemAnaliziDersi.Models;
using SistemAnaliziDersi.ViewModel;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Http.Cors;

namespace SistemAnaliziDersi.Controllers
{
    public class FileUploadingController : ApiController
    {
        //Database1Entities db = new Database1Entities();
        sistemAnaliziEntities db = new sistemAnaliziEntities();
        ResultModel result = new ResultModel();
        string fileType = "";

        [HttpPost]
        [Route("api/fileupload")]
        public async Task<string> UploadFile()
        {
            var ctx = HttpContext.Current;
            var root = ctx.Server.MapPath("~/Files");
            var provider = new MultipartFormDataStreamProvider(root);

            try
            {
                await Request.Content.ReadAsMultipartAsync(provider);

                foreach (var file in provider.FileData)
                {
                    var name = file.Headers.ContentDisposition.FileName;
                    fileType = file.Headers.ContentType.ToString();

                    name = name.Trim('"');

                    var localFileName = file.LocalFileName;
                    var filePath = Path.Combine(root, name);

                    SaveFileBinarySQLServerEF(localFileName, name);
                    File.Move(localFileName, filePath);

                    if (File.Exists(localFileName))
                        File.Delete(localFileName);
                }
            }
            catch (Exception e)
            {
                return $"Error: {e.Message}";
            }

            return "Dosya Yüklendi";
        }

        private void SaveFileBinarySQLServerEF(string localFile, string fileName)
        {
            byte[] fileBytes;
            using (var fs = new FileStream(localFile, FileMode.Open, FileAccess.Read))
            {
                fileBytes = new byte[fs.Length];
                fs.Read(fileBytes, 0, Convert.ToInt32(fs.Length));
            }

            var file = new Files()
            {
                FileBin = fileBytes,
                Name = fileName,
                Type = fileType,
                Size = fileBytes.Length
            };

            db.Files.Add(file);
            db.SaveChanges();

        }

        [HttpGet]
        [Route("api/filelist")]
        [AllowAnonymous]
        public List<FileModel> FileList()
        {
            List<FileModel> list = db.Files.Select(x => new FileModel()
            {
                ID = x.ID,
                Name = x.Name,
                Type = x.Type
            }).ToList();

            return list;
        }

        [HttpDelete]
        [Route("api/filedelete/{id}")]
        public ResultModel DeleteFile(int id)
        {
            Files file = db.Files.Where(q => q.ID == id).SingleOrDefault();

            if(file == null)
            {
                result.process = false;
                result.message = "Dosya bulunamadı!";
                return result;
            }

            string path = HttpContext.Current.Server.MapPath("~/Files/" + file.Name);
            FileInfo fi = new FileInfo(path);
            if(fi != null)
            {
                File.Delete(path);
                fi.Delete();
            }

            db.Files.Remove(file);
            db.SaveChanges();

            result.process = true;
            result.message = file.Name + " silindi";
            return result;
        }

        [HttpGet]
        [Route("api/filedownload/{id}")]
        public HttpResponseMessage GetFile(int id)
        {
            var file = db.Files.Where(q => q.ID == id).FirstOrDefault();
            var result = new HttpResponseMessage(HttpStatusCode.OK);
            var fileName = "";
            var fileBytes = new byte[0];

            if(file != null)
            {
                fileName = file.Name;
                fileBytes = file.FileBin;
            }

            if(fileBytes.Length == 0)
            {
                result.StatusCode = HttpStatusCode.NotFound;
            }
            else
            {
                var fileMemStream = new MemoryStream(fileBytes);

                result.Content = new StreamContent(fileMemStream);

                var headers = result.Content.Headers;

                headers.ContentDisposition = new ContentDispositionHeaderValue("dosya");
                headers.ContentDisposition.FileName = fileName;

                headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

                headers.ContentLength = fileMemStream.Length;
            }

            return result;
        }
    }
}

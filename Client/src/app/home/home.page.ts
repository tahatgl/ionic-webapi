import { Component } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Uploads } from '../models/uploads';
import { ApiService } from '../services/api.service';

import { File } from '@ionic-native/file/ngx';
import { Camera } from '@ionic-native/camera/ngx';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  files: Uploads[];
  selected: FileList;
  apiUrl = "http://192.168.1.36:8082/api/";

  constructor(private api: ApiService,
              private alert: AlertController,
              private toast: ToastController,
              private file: File,
              private camera: Camera,
              private transfer: FileTransfer,
              private fileOpener: FileOpener) {}

  ngOnInit() {
    this.ListFiles();
  }

  ListFiles() {
    this.api.FileList().subscribe((res: Uploads[]) => {
      for(let f of res) {
        switch(f.Type) {
          case "audio/mpeg":
            f.Icon = "musical-note-sharp";
            break;
          case "video/mp4":
            f.Icon = "videocam-outline";
            break;
          case "application/vnd.rar":
            f.Icon = "library-outline";
            break;
          case "application/zip":
            f.Icon = "library";
            break;
          case "image/png":
            f.Icon = "image";
            break;
          case "image/jpeg":
            f.Icon = "image-outline";
            break;
          case "image/jpg":
            f.Icon = "image-outline";
            break;
          case "text/plain":
            f.Icon = "document-text-outline";
            break;
          case "application/pdf":
            f.Icon = "document-text";
            break;
          default:
            f.Icon = "document";
            break;
        }
      }
      this.files = res;
    });
  }

  getCamera() {
    this.camera.getPicture().then((image) => {
      const fileTransfer: FileTransferObject = this.transfer.create();
      fileTransfer.upload(image, this.apiUrl + 'fileupload').then(async q => {
        const toast = await this.toast.create({
          color: 'dark',
          message: 'Dosya yüklendi',
          duration: 1500,
        });
        await toast.present();
        this.ListFiles();
      }, err => {
        console.log(err);
      });
    });
  }

  SelectFile(event) {
    this.selected = event.target.files;
  }

  UploadFile(input: HTMLInputElement) {
    const reader = new FileReader();
    reader.readAsDataURL(input.files[0]);
    reader.onload = () => {
      const fileName = input.files[0].name;
      const postfile = new FormData();
      postfile.append('file', input.files[0], fileName);
      this.api.FileUpload(postfile).subscribe(q => {
        this.ListFiles();
        this.selected = undefined;
      }, err => {
        console.log(err);
      });
    };
  }

  DownloadFile(id: number, name: string, type: string) {
    const fileTransfer: FileTransferObject = this.transfer.create();
    fileTransfer.download(this.apiUrl + "filedownload/" + id, this.file.externalRootDirectory + "Download/" + name).then(async file => {
      if(file) {
        const toast = await this.toast.create({
          color: 'dark',
          message: name + " indirildi",
          duration: 1500,
        });
        await toast.present();
        this.ListFiles();
        this.fileOpener.open(file.toURL(), type);
      }
    }).catch(async x => {
      const toast = await this.toast.create({
        color: 'dark',
        message: "Hata!",
        duration: 1500,
      });
      await toast.present();
    });
  }

  DeleteFile(uploads: Uploads) {
    this.alert.create({
      header: 'Uyarı',
      subHeader: 'Dosya siliniyor...',
      message: 'Dosya silinsin mi?',
      buttons: [
        {
          text: 'Sil',
          role: 'ok',
          handler: () => {
            this.api.FileDelete(uploads.ID).subscribe(async q => {
              if(q) {
                const toast = await this.toast.create({
                  color: 'dark',
                  message: 'Dosya silindi',
                  duration: 1500,
                });
                await toast.present();
                this.ListFiles();
              }
            });
          }
        },
        {
          text: 'Vazgeç',
          role: 'cancel',
          handler: () => {
            this.ListFiles();
          }
        }
      ]
    }).then(res => {
      res.present();
    }).catch((err) => {
      console.log('error: ', err)
    });
  }
}

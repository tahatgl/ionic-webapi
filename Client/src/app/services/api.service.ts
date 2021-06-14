import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  apiUrl = "https://192.168.1.36:443/api/";
  //apiUrl = "http://192.168.1.36:8082/api/";

constructor(private http: HttpClient) { }

FileList() {
  return this.http.get(this.apiUrl + "filelist");
}

FileUpload(file: FormData) {
  return this.http.post(this.apiUrl + "fileupload", file);
}

FileDelete(id: number) {
  return this.http.delete(this.apiUrl + "filedelete/" + id);
}

}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpService } from './services/http/http.service';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    HttpService,
    { provide: 'BASE_API_URL', useValue: 'http://localhost:8080/api' }
  ]
})
export class ExportModelModule { }

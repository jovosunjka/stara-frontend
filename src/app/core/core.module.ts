import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomePageComponent } from './home-page/home-page.component';
import { RouterModule } from '@angular/router';
import { EditorModule } from '../editor/editor.module';



@NgModule({
declarations: [
    HomePageComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    EditorModule
  ],
  providers: [],
  exports: [
    HomePageComponent
  ]
})
export class CoreModule { }

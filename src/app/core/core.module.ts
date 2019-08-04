import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomePageComponent } from './home-page/home-page.component';
import { RouterModule } from '@angular/router';
import { EditorModule } from '../editor/editor.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
declarations: [
    HomePageComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    EditorModule
  ],
  providers: [],
  exports: [
    HomePageComponent
  ]
})
export class CoreModule { }

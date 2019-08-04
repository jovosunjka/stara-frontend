import { Injectable, Inject } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { DataFlowDiagram } from 'src/app/shared/model/data-flow-diagram';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient, @Inject('BASE_API_URL') private baseUrl: string) { }

  post(relativeUrl: string, diagrams: DataFlowDiagram[]): Observable<any> {
    const headers: HttpHeaders = new HttpHeaders({'Content-Type': 'application/json'});
    return this.http.post(this.baseUrl + relativeUrl, diagrams, { headers });
  }
}

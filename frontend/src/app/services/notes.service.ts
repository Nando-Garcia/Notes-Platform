import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Note } from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly apiUrl = `${environment.apiUrl}/notes`;

  constructor(private http: HttpClient) {}

  getNotes(): Observable<Note[]> {
    return this.http.get<Note[]>(this.apiUrl);
  }

  createNote(note: { title: string; content: string }): Observable<Note> {
    return this.http.post<Note>(this.apiUrl, note);
  }

  attachFile(noteId: number, file: File): Observable<Note> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Note>(`${this.apiUrl}/${noteId}/attachments`, form);
  }

  deleteNote(noteId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${noteId}`);
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotesService } from '../../services/notes.service';
import { AuthService } from '../../services/auth.service';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('500ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class NotesComponent implements OnInit {
  notes: Note[] = [];
  newTitle = '';
  newContent = '';
  selectedFile: File | null = null;
  loading = signal(false);
  showForm = signal(false);
  errorMessage = '';

  constructor(
    private notesService: NotesService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes(): void {
    this.loading.set(true);
    this.notesService.getNotes().subscribe({
      next: (data) => {
        this.notes = Array.isArray(data) ? data : [];
        this.loading.set(false);
      },
      error: () => {
        this.notes = [];
        this.loading.set(false);
      },
    });
  }

  createNote(): void {
    if (!this.newTitle.trim() || !this.newContent.trim()) {
      this.errorMessage = 'Completa título y contenido';
      return;
    }

    this.errorMessage = '';
    this.notesService.createNote({ title: this.newTitle, content: this.newContent }).subscribe({
      next: (note) => {
        if (this.selectedFile) {
          this.notesService.attachFile(note.id!, this.selectedFile).subscribe({
            next: () => {
              this.resetForm();
              this.loadNotes();
            },
            error: () => {
              this.errorMessage = 'Nota creada pero hubo un error al adjuntar el archivo';
              this.resetForm();
              this.loadNotes();
            },
          });
        } else {
          this.notes.push(note);
          this.resetForm();
        }
      },
      error: () => {
        this.errorMessage = 'Error al crear la nota';
      },
    });
  }

  resetForm(): void {
    this.newTitle = '';
    this.newContent = '';
    this.selectedFile = null;
    this.showForm.set(false);
  }

  toggleForm(): void {
    this.showForm.set(!this.showForm());
    this.errorMessage = '';
    this.selectedFile = null;
  }

  onFormFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  onFileSelected(noteId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.notesService.attachFile(noteId, file).subscribe({
      next: () => {
        this.loadNotes();
      },
      error: () => {
        this.errorMessage = 'Error al adjuntar el archivo';
      },
    });
  }

  deleteNote(noteId: number): void {
    const confirmed = confirm('¿Estás seguro de que deseas eliminar esta nota? Se eliminará también el archivo adjunto.');
    if (!confirmed) return;

    this.notesService.deleteNote(noteId).subscribe({
      next: () => {
        this.loadNotes();
        this.errorMessage = '';
      },
      error: () => {
        this.errorMessage = 'Error al eliminar la nota';
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}

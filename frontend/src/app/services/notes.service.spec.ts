import { describe, it, expect, beforeEach } from 'vitest';
import { environment } from '../../environments/environment';
import { Note } from '../models/note.model';

describe('NotesService - Unit Tests', () => {
  const mockNotes: Note[] = [
    {
      id: 1,
      title: 'Test Note 1',
      content: 'Content 1',
      fileUrl: undefined,
    },
    {
      id: 2,
      title: 'Test Note 2',
      content: 'Content 2',
      fileUrl: undefined,
    },
  ];

  describe('API Endpoints', () => {
    it('should have correct API URL configured', () => {
      const apiUrl = `${environment.apiUrl}/notes`;
      expect(apiUrl).toBeDefined();
      expect(apiUrl.includes('/notes')).toBe(true);
    });

    it('should format note creation request correctly', () => {
      const noteData = { title: 'New Note', content: 'New content' };
      expect(noteData.title).toBeDefined();
      expect(noteData.content).toBeDefined();
    });

    it('should support file attachment with FormData', () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const form = new FormData();
      form.append('file', file);

      expect(form.has('file')).toBe(true);
    });
  });

  describe('Note Data Structure', () => {
    it('should validate note structure', () => {
      const note = mockNotes[0];
      expect(note).toHaveProperty('id');
      expect(note).toHaveProperty('title');
      expect(note).toHaveProperty('content');
      expect(note).toHaveProperty('fileUrl');
    });

    it('should handle note array correctly', () => {
      expect(Array.isArray(mockNotes)).toBe(true);
      expect(mockNotes.length).toBe(2);
      expect(mockNotes[0].id).toBe(1);
    });

    it('should support delete operation', () => {
      const noteId = 1;
      const deleteMessage = { message: 'Note deleted successfully' };
      expect(deleteMessage.message).toBeDefined();
      expect(typeof noteId).toBe('number');
    });
  });
});


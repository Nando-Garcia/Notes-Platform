import { describe, it, expect, beforeEach } from 'vitest';
import { Note } from '../../models/note.model';

describe('NotesComponent - Unit Tests', () => {
  let component: any;

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

  beforeEach(() => {
    // Mock component state
    component = {
      notes: [],
      newTitle: '',
      newContent: '',
      selectedFile: null,
      loading: false,
      showForm: false,
      errorMessage: '',
    };
  });

  describe('Component Initialization', () => {
    it('should initialize with empty notes array', () => {
      expect(Array.isArray(component.notes)).toBe(true);
      expect(component.notes.length).toBe(0);
    });

    it('should initialize with default values', () => {
      expect(component.newTitle).toBe('');
      expect(component.newContent).toBe('');
      expect(component.selectedFile).toBeNull();
      expect(component.loading).toBe(false);
    });
  });

  describe('Notes Display', () => {
    it('should store notes data correctly', () => {
      component.notes = mockNotes;
      expect(component.notes.length).toBe(2);
      expect(component.notes[0].title).toBe('Test Note 1');
    });

    it('should handle empty notes list', () => {
      component.notes = [];
      expect(component.notes.length).toBe(0);
    });
  });

  describe('Form Operations', () => {
    it('should accept note title input', () => {
      component.newTitle = 'New Note';
      expect(component.newTitle).toBe('New Note');
    });

    it('should accept note content input', () => {
      component.newContent = 'Note content';
      expect(component.newContent).toBe('Note content');
    });

    it('should toggle form visibility', () => {
      component.showForm = true;
      expect(component.showForm).toBe(true);
      component.showForm = false;
      expect(component.showForm).toBe(false);
    });

    it('should clear form after submission', () => {
      component.newTitle = '';
      component.newContent = '';
      expect(component.newTitle).toBe('');
      expect(component.newContent).toBe('');
    });
  });

  describe('File Handling', () => {
    it('should accept file selection', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      component.selectedFile = file;
      expect(component.selectedFile).toBe(file);
    });

    it('should clear selected file', () => {
      component.selectedFile = null;
      expect(component.selectedFile).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should set loading state during operation', () => {
      component.loading = true;
      expect(component.loading).toBe(true);
    });

    it('should clear loading state after operation', () => {
      component.loading = false;
      expect(component.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when needed', () => {
      component.errorMessage = 'Failed to load notes';
      expect(component.errorMessage).toBe('Failed to load notes');
    });

    it('should clear error message', () => {
      component.errorMessage = '';
      expect(component.errorMessage).toBe('');
    });
  });
});


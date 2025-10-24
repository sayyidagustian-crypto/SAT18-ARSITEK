import type { Stroke } from '../types';

// Centralizes the key generation for sketch data in localStorage.
export function makeSketchKey(id: string): string {
    return `sat18-sketch-${id}`;
}

// Creates a simple, unique ID for a new sketch.
export function createSketchId(): string {
    return `sketch-${Date.now()}`;
}

/**
 * Ensures that a blank sketch entry exists in localStorage.
 * This prevents errors when trying to render an embed for a newly created sketch.
 * @param id The ID of the sketch.
 * @returns The sketch ID.
 */
export function ensureEmptySketch(id: string): string {
    const key = makeSketchKey(id);
    if (!localStorage.getItem(key)) {
        // A sketch is an array of strokes. Initialize with an empty array.
        localStorage.setItem(key, JSON.stringify([]));
    }
    return id;
}

/**
 * Retrieves sketch data (an array of strokes) from localStorage.
 * Handles parsing and provides a default empty array on failure.
 * @param id The ID of the sketch.
 * @returns An array of Stroke objects.
 */
export function getSketchData(id:string): Stroke[] {
    try {
        const raw = localStorage.getItem(makeSketchKey(id));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Saves sketch data (an array of strokes) to localStorage and dispatches
 * an event to notify listening components on the same page.
 * @param id The ID of the sketch.
 * @param strokes The array of Stroke objects to save.
 */
export function setSketchData(id: string, strokes: Stroke[]): void {
    try {
        const key = makeSketchKey(id);
        const oldValue = localStorage.getItem(key);
        const newValue = JSON.stringify(strokes);

        // Only update and dispatch if the data has actually changed.
        if (oldValue === newValue) return;

        localStorage.setItem(key, newValue);

        // Manually dispatch a storage event. The native 'storage' event only fires
        // for other tabs/windows, so this allows components on the same page to react.
        window.dispatchEvent(new StorageEvent('storage', {
            key: key,
            newValue: newValue,
            oldValue: oldValue,
            storageArea: localStorage,
            url: window.location.href,
        }));
    } catch (e) {
        console.error(`Could not save sketch ${id}:`, e);
    }
}

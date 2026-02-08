export function EventsEmit(eventName: string, ...data: any[]): void;

export function EventsOn(eventName: string, callback: (...data: any[]) => void): () => void;

export function EventsOnce(eventName: string, callback: (...data: any[]) => void): () => void;

export function EventsOff(eventName: string, ...additionalEventNames: string[]): void;

export function Quit(): void;

export function WindowSetTitle(title: string): void;

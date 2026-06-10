import { jsPDF } from 'jspdf';
import type { Conversation } from '../types';

export function exportAsTxt(conversation: Conversation): void {
  const lines = conversation.messages.map((m) => {
    const role = m.role === 'user' ? 'You' : 'Anas AI';
    const time = new Date(m.timestamp).toLocaleString();
    return `[${time}] ${role}:\n${m.content}\n`;
  });

  const content = `Anas AI Chat Export\nConversation: ${conversation.title}\nExported: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n${lines.join('\n')}`;

  downloadFile(content, `${sanitizeFilename(conversation.title)}.txt`, 'text/plain');
}

export function exportAsPdf(conversation: Conversation): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  doc.setFontSize(18);
  doc.text('Anas AI Chat Export', margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Conversation: ${conversation.title}`, margin, y);
  y += 6;
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
  y += 6;
  doc.text('Created by Anas Ali', margin, y);
  y += 14;

  doc.setTextColor(0);

  for (const message of conversation.messages) {
    const role = message.role === 'user' ? 'You' : 'Anas AI';
    const time = new Date(message.timestamp).toLocaleString();

    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${role} — ${time}`, margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(message.content, maxWidth);

    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 5;
    }

    y += 8;
  }

  doc.save(`${sanitizeFilename(conversation.title)}.pdf`);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').slice(0, 50) || 'chat';
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

import axiosInstance from './axiosConfig';
import type { PdfExportSettings } from '../types';

export interface PdfExportResponse {
  blob: Blob;
  filename: string;
}

/**
 * Export skill sheet as PDF
 */
export const exportPDF = async (token: string, settings: PdfExportSettings): Promise<PdfExportResponse> => {
  const response = await axiosInstance.post('/export/pdf', settings, {
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Extract filename from Content-Disposition header
  const contentDisposition = response.headers['content-disposition'];
  let filename = `【スキルシート】_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.pdf`;

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = decodeURIComponent(filenameMatch[1]);
    }
  }

  return {
    blob: response.data,
    filename,
  };
};

/**
 * Export skill sheet as PDF for a specific user (admin only)
 */
export const exportPDFForUser = async (userId: number, token: string, settings: PdfExportSettings): Promise<PdfExportResponse> => {
  const response = await axiosInstance.post(`/export/pdf/${userId}`, settings, {
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Extract filename from Content-Disposition header
  const contentDisposition = response.headers['content-disposition'];
  let filename = `【スキルシート】_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.pdf`;

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = decodeURIComponent(filenameMatch[1]);
    }
  }

  return {
    blob: response.data,
    filename,
  };
};

/**
 * Download PDF file
 */
export const downloadPDF = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

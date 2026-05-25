import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildOrderPdfHtml } from './order-pdf-html';
import { formatDate, formatCurrency } from './utils';

export async function shareOrderPdf(order: any, type: 'bill' | 'menu', isQuotation: boolean, bill?: any) {
  try {
    const html = buildOrderPdfHtml(order, {
      useEnglish: true,
      formatDate,
      formatCurrency,
      isQuotation,
      bill,
      hideMenuDetails: type === 'bill',
      hideBillDetails: type === 'menu',
      baseUrl: "https://www.skccaterers.in"
    });

    const { uri } = await Print.printToFileAsync({ html });
    
    // Check if sharing is available
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${isQuotation ? 'Quotation' : 'Bill'} - ${type === 'bill' ? 'Summary' : 'Menu'}`,
        UTI: 'com.adobe.pdf'
      });
    } else {
      alert("Sharing is not available on this device.");
    }
  } catch (error: any) {
    console.error("PDF generation or sharing error:", error);
    alert(`Failed to share PDF: ${error.message}`);
  }
}

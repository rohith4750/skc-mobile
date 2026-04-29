import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateInvoiceHTML, generateMenuHTML } from './pdfTemplates';

export const exportBillToPDF = async (bill: any) => {
  try {
    const html = generateInvoiceHTML(bill);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    return false;
  }
};

export const exportMenuToPDF = async (menuItems: any[]) => {
  try {
    const html = generateMenuHTML(menuItems);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    return true;
  } catch (error) {
    console.error('Menu Export Error:', error);
    return false;
  }
};

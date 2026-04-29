import { Colors } from '../theme/colors';

export const generateInvoiceHTML = (bill: any) => {
  const itemsHtml = bill.order?.items?.map((item: any) => `
    <tr>
      <td>${item.menuItem?.name || item.name}</td>
      <td style="text-align: center;">${item.quantity} ${item.unit || ''}</td>
      <td style="text-align: right;">₹${Number(item.price).toLocaleString('en-IN')}</td>
      <td style="text-align: right;">₹${(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}</td>
    </tr>
  `).join('') || '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 40px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 30px; }
          .logo-area { display: flex; align-items: center; }
          .logo-text { font-size: 28px; font-weight: 900; color: ${Colors.primary}; margin-left: 10px; }
          .bill-details { text-align: right; }
          .bill-details h1 { margin: 0; color: #1A202C; font-size: 24px; }
          .bill-details p { margin: 5px 0; color: #718096; font-size: 14px; }
          
          .customer-section { margin-bottom: 40px; }
          .customer-section h3 { font-size: 14px; text-transform: uppercase; color: #A0AEC0; margin-bottom: 10px; letter-spacing: 1px; }
          .customer-name { font-size: 18px; font-weight: 700; margin: 0; }
          .customer-info { color: #4A5568; margin: 5px 0; font-size: 14px; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #F7FAFC; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #718096; border-bottom: 1px solid #EDF2F7; }
          td { padding: 12px; border-bottom: 1px solid #EDF2F7; font-size: 14px; }

          .summary { display: flex; justify-content: flex-end; }
          .summary-table { width: 250px; }
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #EDF2F7; }
          .summary-row.total { border-bottom: none; padding-top: 15px; font-weight: 900; font-size: 18px; color: ${Colors.primary}; }
          .summary-label { color: #718096; font-size: 14px; }
          
          .footer { margin-top: 50px; text-align: center; border-top: 1px solid #EDF2F7; padding-top: 20px; }
          .footer p { color: #A0AEC0; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-area">
            <div class="logo-text">SKC CATERERS</div>
          </div>
          <div class="bill-details">
            <h1>INVOICE</h1>
            <p>#${bill.id.slice(-6).toUpperCase()}</p>
            <p>Date: ${new Date(bill.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div class="customer-section">
          <h3>Billed To</h3>
          <p class="customer-name">${bill.order?.customer?.name || 'Valued Customer'}</p>
          <p class="customer-info">${bill.order?.customer?.phone || ''}</p>
          <p class="customer-info">${bill.order?.address || ''}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-table">
            <div class="summary-row">
              <span class="summary-label">Subtotal</span>
              <span>₹${Number(bill.totalAmount).toLocaleString('en-IN')}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Paid Amount</span>
              <span style="color: #2E7D32;">₹${Number(bill.paidAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div class="summary-row total">
              <span>BALANCE DUE</span>
              <span>₹${Number(bill.remainingAmount || bill.dueAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing SKC Caterers!</p>
          <p>For any queries, please contact us at +91 99999 99999</p>
        </div>
      </body>
    </html>
  `;
};

export const generateMenuHTML = (menuItems: any[]) => {
  const categorized = menuItems.reduce((acc: any, item: any) => {
    const type = item.type?.[0] || 'GENERAL';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  const sectionsHtml = Object.keys(categorized).map(type => `
    <div class="menu-section">
      <h2 class="section-title">${type}</h2>
      <div class="items-grid">
        ${categorized[type].map((item: any) => `
          <div class="menu-item">
            <div class="item-main">
              <span class="item-name">${item.name}</span>
              <span class="item-dots"></span>
              <span class="item-price">₹${item.price}</span>
            </div>
            ${item.nameTelugu ? `<div class="item-telugu">${item.nameTelugu}</div>` : ''}
            <div class="item-desc">${item.description || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1A202C; margin: 0; padding: 50px; background: #FFF; }
          .header { text-align: center; border-bottom: 3px double ${Colors.primary}; padding-bottom: 20px; margin-bottom: 40px; }
          .logo-title { font-size: 36px; font-weight: 900; color: ${Colors.primary}; letter-spacing: 2px; }
          .subtitle { font-size: 14px; text-transform: uppercase; color: #718096; letter-spacing: 4px; margin-top: 10px; }
          
          .menu-section { margin-bottom: 40px; }
          .section-title { font-size: 20px; font-weight: 800; color: ${Colors.primary}; border-bottom: 1px solid #EDF2F7; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; }
          
          .items-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
          .menu-item { margin-bottom: 15px; }
          .item-main { display: flex; align-items: baseline; font-weight: 700; font-size: 16px; }
          .item-name { flex-shrink: 0; }
          .item-dots { flex: 1; border-bottom: 1px dotted #CBD5E0; margin: 0 10px; }
          .item-price { flex-shrink: 0; }
          
          .item-telugu { color: ${Colors.primary}; font-size: 12px; margin-top: 2px; }
          .item-desc { color: #718096; font-size: 11px; margin-top: 4px; font-weight: 400; line-height: 1.4; }
          
          .footer { margin-top: 60px; text-align: center; font-style: italic; color: #718096; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-title">SKC CATERERS</div>
          <div class="subtitle">Premium Catering Services</div>
        </div>
        ${sectionsHtml}
        <div class="footer">
          <p>Prices are subject to change based on seasonal availability.</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
    </html>
  `;
};

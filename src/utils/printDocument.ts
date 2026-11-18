function collectStylesHtml(): string {
  const parts: string[] = [];
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    parts.push(node.outerHTML);
  });
  return parts.join('\n');
}

function buildStandaloneHtml(element: HTMLElement, title: string): string {
  const styles = collectStylesHtml();
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    ${styles}
    <style>
      @page { size: A4; margin: 12mm; }
      html, body {
        background: #ffffff !important;
        color: #0f172a !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .printable-doc {
        width: 100% !important;
        max-width: 210mm !important;
        margin: 0 auto !important;
        padding: 12mm !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
      }
      @media print {
        .printable-doc { padding: 0 !important; }
        .page-break { page-break-before: always; break-before: page; }
        .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    ${element.outerHTML}
  </body>
</html>`;
}

export function printDocumentElement(element: HTMLElement | null, title: string): void {
  if (!element) {
    window.print();
    return;
  }

  const prevTitle = document.title;
  document.title = title;

  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      window.print();
      document.title = prevTitle;
      return;
    }

    iframeDoc.open();
    iframeDoc.write(buildStandaloneHtml(element, title));
    iframeDoc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
          document.title = prevTitle;
        }, 1000);
      }
    };

    // Wait briefly for stylesheets and images inside iframe
    setTimeout(triggerPrint, 350);
  } catch {
    window.print();
    document.title = prevTitle;
  }
}

export function downloadDocumentHtml(
  element: HTMLElement | null,
  title: string,
  filename: string
): void {
  if (!element) return;
  const html = buildStandaloneHtml(element, title);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

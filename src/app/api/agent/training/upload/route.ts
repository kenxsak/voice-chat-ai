import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { getCollections } from '@/lib/mongodb';

// Add a GET method for testing the route
export async function GET() {
  return NextResponse.json({ 
    message: 'Training upload API is working',
    timestamp: new Date().toISOString()
  });
}

// Helper function to extract text from PDF buffer with comprehensive extraction
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const fileSize = (buffer.byteLength / 1024).toFixed(2);
  const fileSizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(2);
  
  console.log(`[PDF Processing] Starting extraction for ${fileSizeMB} MB PDF (${fileSize} KB)`);
  
  try {
    // Use pdf-parse for text extraction (works in Node.js runtime)
    const pdfParse = require('pdf-parse');
    const pdfBuffer = Buffer.from(buffer);
    
    console.log('[PDF Processing] Parsing PDF with pdf-parse...');
    const data = await pdfParse(pdfBuffer, {
      max: 0, // Extract all pages
      version: 'default',
    });
    
    let extractedText = data.text || '';
    const pageCount = data.numpages || 0;
    const infoObj = data.info || {};
    
    console.log(`[PDF Processing] Extracted text from ${pageCount} pages`);
    console.log(`[PDF Processing] PDF Info:`, {
      title: infoObj.Title,
      author: infoObj.Author,
      pages: pageCount,
      textLength: extractedText.length
    });
    
    // Clean and normalize the extracted text
    extractedText = extractedText
      .replace(/\r\n/g, '\n')  // Normalize line breaks
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
      .replace(/\t/g, ' ')  // Replace tabs with spaces
      .replace(/ {2,}/g, ' ')  // Remove excessive spaces
      .trim();
    
    // Calculate statistics
    const wordCount = extractedText.split(/\s+/).filter((w: string) => w.length > 0).length;
    const charCount = extractedText.length;
    
    // Check if we got meaningful content
    if (!extractedText || extractedText.length < 50) {
      console.warn('[PDF Processing] Very little text extracted, PDF may be image-based');
      return `📄 PDF Document Processed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File Size: ${fileSize} KB (${fileSizeMB} MB)
Pages: ${pageCount}
Title: ${infoObj.Title || 'N/A'}

⚠️ Limited Text Extracted

This PDF appears to be image-based or scanned. Only ${charCount} characters were extracted.

To ensure complete content capture:

1. If this is a scanned PDF, use OCR software to convert it
2. Or manually copy the text from the PDF:
   - Open your PDF file
   - Select all text (Ctrl+A or Cmd+A)
   - Copy (Ctrl+C or Cmd+C)
   - Click EDIT on this training entry
   - Paste your content and SAVE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extracted Content (if any):
${extractedText}`;
    }
    
    // Add PDF metadata header
    const header = `[PDF Document: ${infoObj.Title || 'Untitled'} | Pages: ${pageCount} | Words: ${wordCount} | Characters: ${charCount}]\n\n`;
    
    console.log(`[PDF Processing] ✅ Success: Extracted ${wordCount} words, ${charCount} characters from ${pageCount} pages`);
    console.log(`[PDF Processing] Preview: ${extractedText.substring(0, 200)}...`);
    
    return header + extractedText;
    
  } catch (error: any) {
    console.error('[PDF Processing] ❌ Error during extraction:', error.message);
    console.error('[PDF Processing] Stack:', error.stack);
    
    // Fallback message if extraction fails
    return `📄 PDF Upload - Manual Entry Required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File Size: ${fileSize} KB (${fileSizeMB} MB)

⚠️ Automatic extraction failed: ${error.message}

Please manually add your PDF content:

1. Open your PDF file
2. Select all text (Ctrl+A or Cmd+A)
3. Copy the text (Ctrl+C or Cmd+C)
4. Click the EDIT button on this training entry
5. Replace this message with your copied PDF text
6. Click SAVE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 TIP: You can paste the entire PDF content here. The AI will use it to answer questions accurately!`;
  }
}

// Helper function to extract text from text file
async function extractTextFromFile(buffer: ArrayBuffer): Promise<string> {
  try {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer);
    console.log(`[Text File] Extracted ${text.length} characters`);
    
    if (!text || text.trim().length < 10) {
      throw new Error('Text file is empty or too short');
    }
    
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    console.log(`[Text File] ✅ Success: ${wordCount} words extracted`);
    
    return text.trim();
  } catch (error: any) {
    console.error('[Text File] Extraction error:', error);
    throw new Error('Failed to extract text from file: ' + error.message);
  }
}

// Helper function to scrape comprehensive website content
async function scrapeWebsiteComprehensive(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutMs = 30000; // 30 seconds
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    
    console.log(`[Website Scraping] Starting for: ${url}`);
    
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal,
    });
    
    clearTimeout(timer);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      throw new Error(`Not an HTML page (Content-Type: ${contentType})`);
    }
    
    const html = await response.text();
    console.log(`[Website Scraping] Fetched ${html.length} characters of HTML`);
    
    // Enhanced HTML parsing
    let text = html
      // Remove scripts and styles
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/g, "'")
      // Clean whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    
    console.log(`[Website Scraping] ✅ Extracted ${text.length} characters (${wordCount} words)`);
    console.log(`[Website Scraping] Preview: ${text.substring(0, 300)}...`);
    
    if (!text || text.length < 50) {
      throw new Error('Website content is too short or empty');
    }
    
    return text;
    
  } catch (error: any) {
    console.error(`[Website Scraping] ❌ Failed for ${url}:`, error.message);
    throw new Error(`Website scraping failed: ${error.message}`);
  }
}

// POST handler for file/website upload
export async function POST(request: NextRequest) {
  console.log('[Training Upload API] POST request received');
  
  try {
    const session = await getSessionFromCookies();
    console.log('[Training Upload API] Session check:', !!session);
    if (!session) {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized' 
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const tenantId = formData.get('tenantId') as string;
    const agentId = formData.get('agentId') as string;
    const uploadType = formData.get('uploadType') as string; // 'file' or 'website'
    
    console.log('[Training Upload] Request params:', { tenantId, agentId, uploadType });
    
    if (!tenantId || !agentId || !uploadType) {
      return NextResponse.json({ 
        success: false,
        message: 'Missing required fields: tenantId, agentId, uploadType' 
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let extractedText = '';
    let sourceInfo = '';

    if (uploadType === 'file') {
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ 
          success: false,
          message: 'No file provided' 
        }, { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const buffer = await file.arrayBuffer();
      const fileType = file.type;
      const fileName = file.name;
      
      console.log(`[Training Upload] Processing file: ${fileName} (${fileType})`);
      
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        // PDF files - create placeholder for manual entry
        extractedText = await extractTextFromPDF(buffer);
        sourceInfo = `PDF Document: ${fileName}`;
        console.log('[Training Upload] ✅ PDF placeholder created - awaiting manual content entry');
      } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        // Text files - extract directly
        extractedText = await extractTextFromFile(buffer);
        sourceInfo = `Text File: ${fileName}`;
        console.log('[Training Upload] ✅ Text file processed successfully');
      } else {
        return NextResponse.json({ 
          success: false,
          message: 'Unsupported file type. Please upload PDF or TXT files only.' 
        }, { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } else if (uploadType === 'website') {
      const websiteUrl = formData.get('websiteUrl') as string;
      if (!websiteUrl) {
        return NextResponse.json({ 
          success: false,
          message: 'No website URL provided' 
        }, { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
      } catch {
        return NextResponse.json({ 
          success: false,
          message: 'Invalid website URL' 
        }, { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log(`[Training Upload] Processing website: ${websiteUrl}`);
      extractedText = await scrapeWebsiteComprehensive(websiteUrl);
      sourceInfo = `Website: ${websiteUrl}`;
      console.log('[Training Upload] ✅ Website scraped successfully');
    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid upload type' 
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Allow saving even with placeholder content (for PDF manual entry)
    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({ 
        success: false,
        message: 'No content could be extracted. Please check your file or URL.' 
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { tenants } = await getCollections();
    
    const wordCount = extractedText.split(/\s+/).filter(w => w.length > 0).length;
    
    const trainingContext = {
      id: `training_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      agentId,
      sourceInfo,
      extractedText,
      uploadedDocContent: extractedText, // Store in this field for AI access
      createdAt: new Date().toISOString(),
      wordCount: wordCount,
      characterCount: extractedText.length,
    };

    console.log(`[Training Upload] Storing training data:`, {
      id: trainingContext.id,
      sourceInfo: trainingContext.sourceInfo,
      wordCount: trainingContext.wordCount,
      characterCount: trainingContext.characterCount,
    });

    const result = await tenants.updateOne(
      { id: tenantId },
      { 
        $push: { 
          [`agents.$[agent].trainingContexts`]: trainingContext 
        } as any
      },
      { 
        arrayFilters: [{ 'agent.id': agentId }] 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false,
        message: 'Tenant or agent not found' 
      }, { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Training Upload] ✅ Successfully stored training data for agent ${agentId}`);
    console.log(`[Training Upload] Final stats: ${wordCount} words, ${trainingContext.characterCount} characters`);

    return NextResponse.json({
      success: true,
      message: 'Training data uploaded and processed successfully',
      trainingContext: {
        id: trainingContext.id,
        sourceInfo: trainingContext.sourceInfo,
        wordCount: trainingContext.wordCount,
        characterCount: trainingContext.characterCount,
        createdAt: trainingContext.createdAt,
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('[Training Upload] ❌ Error:', error.message);
    console.error('[Training Upload] Stack:', error.stack);
    return NextResponse.json({ 
      success: false,
      message: error.message || 'Internal server error' 
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}
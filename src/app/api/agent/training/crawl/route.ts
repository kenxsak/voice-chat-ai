import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { getCollections } from '@/lib/mongodb';

interface CrawlResult {
  url: string;
  status: 'success' | 'failed' | 'skipped';
  title?: string;
  error?: string;
  wordCount?: number;
  trainingId?: string;
}

interface RobotsRules {
  disallowedPaths: string[];
  crawlDelay: number;
}

interface RobotsTxtResult {
  allowed: boolean;
  crawlDelay: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRobotsTxt(text: string, userAgent: string = 'Mozilla'): RobotsRules {
  const lines = text.split('\n');
  const disallowedPaths: string[] = [];
  let crawlDelay = 0;
  let isRelevantSection = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.toLowerCase().startsWith('user-agent:')) {
      const agent = trimmedLine.substring(11).trim().toLowerCase();
      isRelevantSection = agent === '*' || agent === userAgent.toLowerCase();
    } else if (isRelevantSection) {
      if (trimmedLine.toLowerCase().startsWith('disallow:')) {
        const path = trimmedLine.substring(9).trim();
        if (path) {
          disallowedPaths.push(path);
        }
      } else if (trimmedLine.toLowerCase().startsWith('crawl-delay:')) {
        const delay = parseFloat(trimmedLine.substring(12).trim());
        if (!isNaN(delay)) {
          crawlDelay = Math.max(crawlDelay, delay);
        }
      }
    }
  }
  
  return { disallowedPaths, crawlDelay };
}

function isAllowedByRobots(url: string, rules: RobotsRules): boolean {
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  
  for (const disallowedPath of rules.disallowedPaths) {
    if (disallowedPath === '/') {
      return false;
    }
    
    if (disallowedPath.endsWith('*')) {
      const prefix = disallowedPath.slice(0, -1);
      if (path.startsWith(prefix)) {
        return false;
      }
    } else if (path.startsWith(disallowedPath)) {
      return false;
    }
  }
  
  return true;
}

async function checkRobotsTxt(domain: string, userAgent: string = 'Mozilla'): Promise<RobotsTxtResult> {
  try {
    const robotsUrl = `${domain}/robots.txt`;
    console.log(`[Robots.txt] Checking: ${robotsUrl}`);
    
    const controller = new AbortController();
    const timeoutMs = 10000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': userAgent,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timer);
    
    if (response.status === 404) {
      console.log('[Robots.txt] Not found (404), allowing crawl');
      return { allowed: true, crawlDelay: 1 };
    }
    
    if (!response.ok) {
      console.log(`[Robots.txt] HTTP ${response.status}, allowing crawl by default`);
      return { allowed: true, crawlDelay: 1 };
    }
    
    const text = await response.text();
    const rules = parseRobotsTxt(text, userAgent);
    
    const rootAllowed = isAllowedByRobots(domain, rules);
    const effectiveCrawlDelay = Math.max(1, rules.crawlDelay * 1000);
    
    console.log(`[Robots.txt] Parsed - Allowed: ${rootAllowed}, Crawl-delay: ${effectiveCrawlDelay}ms`);
    
    return { 
      allowed: rootAllowed, 
      crawlDelay: effectiveCrawlDelay 
    };
    
  } catch (error: any) {
    console.log(`[Robots.txt] Error fetching robots.txt: ${error.message}, allowing crawl by default`);
    return { allowed: true, crawlDelay: 1000 };
  }
}

async function scrapeWebsiteComprehensive(url: string): Promise<{ text: string; title: string; html: string }> {
  try {
    const controller = new AbortController();
    const timeoutMs = 30000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    
    console.log(`[Website Scraping] Starting for: ${url}`);
    
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
    
    let title = '';
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1]
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
        .trim();
    }
    
    let text = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    
    console.log(`[Website Scraping] ✅ Extracted ${text.length} characters (${wordCount} words)`);
    
    if (!text || text.length < 50) {
      throw new Error('Website content is too short or empty');
    }
    
    return { text, title, html };
    
  } catch (error: any) {
    console.error(`[Website Scraping] ❌ Failed for ${url}:`, error.message);
    throw new Error(`Website scraping failed: ${error.message}`);
  }
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const baseUrlObj = new URL(baseUrl);
  const baseDomain = baseUrlObj.hostname;
  
  const hrefRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match;
  
  while ((match = hrefRegex.exec(html)) !== null) {
    try {
      const href = match[1];
      
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }
      
      let absoluteUrl: URL;
      if (href.startsWith('http://') || href.startsWith('https://')) {
        absoluteUrl = new URL(href);
      } else if (href.startsWith('//')) {
        absoluteUrl = new URL(baseUrlObj.protocol + href);
      } else if (href.startsWith('/')) {
        absoluteUrl = new URL(href, baseUrl);
      } else {
        absoluteUrl = new URL(href, baseUrl);
      }
      
      if (absoluteUrl.hostname === baseDomain) {
        const normalizedUrl = absoluteUrl.origin + absoluteUrl.pathname;
        links.push(normalizedUrl);
      }
      
    } catch (e) {
      continue;
    }
  }
  
  return [...new Set(links)];
}

async function crawlWebsite(
  rootUrl: string,
  maxPages: number,
  tenantId: string,
  agentId: string,
  tenants: any
): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];
  const visited = new Set<string>();
  const toVisit: string[] = [rootUrl];
  const startTime = Date.now();
  const maxTotalTime = 5 * 60 * 1000;
  
  console.log(`[Crawler] Starting crawl from ${rootUrl}, max pages: ${maxPages}`);
  
  const rootUrlObj = new URL(rootUrl);
  const domain = `${rootUrlObj.protocol}//${rootUrlObj.hostname}`;
  
  const robotsCheck = await checkRobotsTxt(domain);
  
  if (!robotsCheck.allowed) {
    console.log('[Crawler] ❌ Crawling disallowed by robots.txt');
    return [{
      url: rootUrl,
      status: 'failed',
      error: 'Crawling disallowed by robots.txt'
    }];
  }
  
  const crawlDelay = robotsCheck.crawlDelay;
  console.log(`[Crawler] Using crawl delay: ${crawlDelay}ms`);
  
  let robotsRules: RobotsRules | null = null;
  try {
    const robotsUrl = `${domain}/robots.txt`;
    const robotsResponse = await fetch(robotsUrl, { 
      headers: { 'User-Agent': 'Mozilla' },
      signal: AbortSignal.timeout(10000)
    });
    if (robotsResponse.ok) {
      const robotsText = await robotsResponse.text();
      robotsRules = parseRobotsTxt(robotsText);
      console.log(`[Crawler] Loaded robots.txt rules: ${robotsRules.disallowedPaths.length} disallowed paths`);
    }
  } catch (e) {
    console.log('[Crawler] Could not load robots.txt rules for path checking');
  }
  
  while (toVisit.length > 0 && visited.size < maxPages) {
    if (Date.now() - startTime > maxTotalTime) {
      console.log('[Crawler] Total timeout reached (5 minutes)');
      break;
    }
    
    const currentUrl = toVisit.shift()!;
    
    if (visited.has(currentUrl)) {
      results.push({
        url: currentUrl,
        status: 'skipped',
        error: 'Already visited'
      });
      continue;
    }
    
    if (robotsRules && !isAllowedByRobots(currentUrl, robotsRules)) {
      console.log(`[Crawler] ⊘ Skipping ${currentUrl} (disallowed by robots.txt)`);
      results.push({
        url: currentUrl,
        status: 'skipped',
        error: 'Disallowed by robots.txt'
      });
      continue;
    }
    
    visited.add(currentUrl);
    
    try {
      await sleep(crawlDelay);
      
      const { text, title, html } = await scrapeWebsiteComprehensive(currentUrl);
      
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      
      const trainingContext = {
        id: `training_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        agentId,
        sourceInfo: `Website: ${currentUrl}`,
        extractedText: text,
        uploadedDocContent: text,
        createdAt: new Date().toISOString(),
        wordCount: wordCount,
        characterCount: text.length,
        pageTitle: title || undefined,
      };
      
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
        throw new Error('Tenant or agent not found');
      }
      
      results.push({
        url: currentUrl,
        status: 'success',
        title: title || undefined,
        wordCount: wordCount,
        trainingId: trainingContext.id
      });
      
      console.log(`[Crawler] ✅ Successfully crawled and saved: ${currentUrl} (${wordCount} words)`);
      
      const newLinks = extractLinks(html, currentUrl);
      
      for (const link of newLinks) {
        if (!visited.has(link) && !toVisit.includes(link)) {
          if (!robotsRules || isAllowedByRobots(link, robotsRules)) {
            toVisit.push(link);
          } else {
            console.log(`[Crawler] ⊘ Not queueing ${link} (disallowed by robots.txt)`);
          }
        }
      }
      
    } catch (error: any) {
      console.error(`[Crawler] ❌ Failed to crawl ${currentUrl}:`, error.message);
      results.push({
        url: currentUrl,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  console.log(`[Crawler] Finished crawling. Visited: ${visited.size}, Total results: ${results.length}`);
  
  return results;
}

export async function POST(request: NextRequest) {
  console.log('[Crawler API] POST request received');
  
  try {
    const session = await getSessionFromCookies();
    console.log('[Crawler API] Session check:', !!session);
    
    if (!session) {
      return NextResponse.json({ 
        success: false,
        message: 'Unauthorized' 
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { agentId, rootUrl, maxPages = 10 } = body;
    
    console.log('[Crawler API] Request params:', { agentId, rootUrl, maxPages });
    
    if (!agentId || !rootUrl) {
      return NextResponse.json({ 
        success: false,
        message: 'Missing required fields: agentId, rootUrl' 
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let normalizedUrl = rootUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid rootUrl format. Please provide a valid URL.' 
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validatedMaxPages = Math.min(Math.max(1, parseInt(String(maxPages)) || 10), 50);

    const { tenants } = await getCollections();
    
    const tenant = await tenants.findOne({
      $or: [
        { id: session.tenantId },
        ...(session.role === 'superadmin' ? [{}] : [])
      ]
    });
    
    if (!tenant) {
      return NextResponse.json({ 
        success: false,
        message: 'Tenant not found' 
      }, { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const agent = tenant.agents?.find((a: any) => a.id === agentId);
    if (!agent) {
      return NextResponse.json({ 
        success: false,
        message: 'Agent not found or you do not have access to this agent' 
      }, { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tenantId = tenant.id;

    console.log(`[Crawler API] Starting crawl: ${normalizedUrl}, max pages: ${validatedMaxPages}`);

    const crawlResults = await crawlWebsite(normalizedUrl, validatedMaxPages, tenantId, agentId, tenants);

    const successCount = crawlResults.filter(r => r.status === 'success').length;
    const failedCount = crawlResults.filter(r => r.status === 'failed').length;
    const skippedCount = crawlResults.filter(r => r.status === 'skipped').length;

    console.log(`[Crawler API] ✅ Crawl complete: ${successCount} success, ${failedCount} failed, ${skippedCount} skipped`);

    return NextResponse.json({
      success: true,
      message: `Successfully crawled ${successCount} pages`,
      summary: {
        totalCrawled: successCount,
        totalFailed: failedCount,
        totalSkipped: skippedCount,
        totalPages: crawlResults.length
      },
      pages: crawlResults
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('[Crawler API] ❌ Error:', error.message);
    console.error('[Crawler API] Stack:', error.stack);
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

export function getClientIp(request: Request): string | null {
  try {
    const headers = request.headers;
    
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      return ips[0] || null;
    }
    
    const realIp = headers.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
    
    const cfConnectingIp = headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }
    
    return null;
  } catch (error) {
    console.error('[IP Utils] Error extracting IP:', error);
    return null;
  }
}

export function hashIpForPrivacy(ip: string | null): string | null {
  if (!ip) return null;
  
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  
  const ipv6Parts = ip.split(':');
  if (ipv6Parts.length >= 4) {
    return `${ipv6Parts[0]}:${ipv6Parts[1]}:${ipv6Parts[2]}:***`;
  }
  
  return ip.substring(0, Math.min(ip.length, 12)) + '***';
}

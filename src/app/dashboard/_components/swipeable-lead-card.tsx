'use client';

import React, { useState } from 'react';
import { useSwipe } from '@/hooks/use-swipe';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Archive, 
  Sparkles,
  ChevronRight,
  User,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Lead {
  _id?: string;
  id?: string;
  customerInfo: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  date?: string;
  status?: string;
  summary?: string;
  summaryData?: {
    problemsDiscussed?: string[];
    solutionsProvided?: string[];
    suggestionsGiven?: string[];
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
  };
  history?: any[];
  imageUrl?: string | null;
  isReturningCustomer?: boolean;
  totalCustomerSessions?: number;
  isAnonymous?: boolean;
}

interface SwipeableLeadCardProps {
  lead: Lead;
  onContact?: () => void;
  onArchive?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function SwipeableLeadCard({
  lead,
  onContact,
  onArchive,
  onViewDetails,
  className
}: SwipeableLeadCardProps) {
  const [isActioned, setIsActioned] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const { swipeHandlers, swipeState } = useSwipe({
    onSwipeLeft: () => {
      if (onArchive && isMobile) {
        setIsActioned(true);
        setTimeout(() => onArchive(), 200);
      }
    },
    onSwipeRight: () => {
      if (onContact && isMobile) {
        setIsActioned(true);
        setTimeout(() => onContact(), 200);
      }
    }
  }, {
    threshold: 100,
    preventScroll: false
  });

  const getSwipeProgress = () => {
    if (!swipeState.isSwiping) return 0;
    return Math.min(swipeState.swipePercentage, 100);
  };

  const swipeProgress = getSwipeProgress();
  const showLeftAction = swipeState.swipeDirection === 'left' && swipeProgress > 20;
  const showRightAction = swipeState.swipeDirection === 'right' && swipeProgress > 20;

  const customerName = lead.customerName || lead.summaryData?.customerName || lead.customerInfo?.split(',')[0] || 'Anonymous';
  const customerEmail = lead.customerEmail || lead.summaryData?.customerEmail;
  const customerPhone = lead.customerPhone || lead.summaryData?.customerPhone;
  const leadDate = lead.date ? new Date(lead.date) : new Date();

  const aiSummary = lead.summaryData?.problemsDiscussed?.[0] || 
                    lead.summary?.substring(0, 100) || 
                    'AI analysis not available yet';

  return (
    <div className={cn('relative group', className)}>
      {/* Swipe action indicators - mobile only */}
      {isMobile && (
        <>
          {/* Archive (Left swipe) */}
          <div 
            className={cn(
              'absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center transition-opacity duration-200 rounded-r-xl',
              'bg-gradient-to-l from-red-500/20 to-transparent border-r-2 border-red-500/30',
              showLeftAction ? 'opacity-100' : 'opacity-0'
            )}
          >
            <Archive className="w-6 h-6 text-red-400" />
          </div>

          {/* Contact (Right swipe) */}
          <div 
            className={cn(
              'absolute left-0 top-0 bottom-0 w-24 flex items-center justify-center transition-opacity duration-200 rounded-l-xl',
              'bg-gradient-to-r from-green-500/20 to-transparent border-l-2 border-green-500/30',
              showRightAction ? 'opacity-100' : 'opacity-0'
            )}
          >
            <Phone className="w-6 h-6 text-green-400" />
          </div>
        </>
      )}

      <Card 
        {...(isMobile ? swipeHandlers : {})}
        className={cn(
          'transition-all duration-200 border border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden',
          'hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5',
          isMobile && swipeState.isSwiping && 'cursor-grabbing',
          isMobile && !swipeState.isSwiping && 'cursor-grab',
          isActioned && 'opacity-0 scale-95',
          showLeftAction && 'translate-x-[-8px]',
          showRightAction && 'translate-x-[8px]'
        )}
        style={{
          transform: isMobile && swipeState.isSwiping 
            ? `translateX(${swipeState.swipeDirection === 'left' ? -swipeProgress/3 : swipeProgress/3}px)` 
            : undefined
        }}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-10 h-10 border-2 border-primary/20">
              <AvatarImage src={lead.imageUrl || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-gray-400/20 to-gray-500/20">
                {customerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{customerName}</h3>
                {lead.isReturningCustomer && (
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    Returning
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(leadDate, 'MMM d, h:mm a')}
                </span>
                {lead.totalCustomerSessions && lead.totalCustomerSessions > 1 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {lead.totalCustomerSessions} chats
                  </span>
                )}
              </div>
            </div>

            <Badge 
              variant={lead.status === 'contacted' ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                lead.status === 'contacted' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-primary/20 text-primary border-primary/30'
              )}
            >
              {lead.status || 'New'}
            </Badge>
          </div>

          {/* AI Summary Section */}
          <div className="mb-3 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-muted/10 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">AI Summary</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{aiSummary}</p>
          </div>

          {/* Contact Info */}
          <div className="space-y-1.5 mb-3">
            {customerEmail && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3 h-3 text-muted-foreground" />
                <span className="truncate">{customerEmail}</span>
              </div>
            )}
            {customerPhone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="w-3 h-3 text-muted-foreground" />
                <span>{customerPhone}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {/* Desktop buttons - always visible */}
            {!isMobile && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onContact}
                  className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Contact
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onArchive}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Archive className="w-3 h-3" />
                </Button>
              </>
            )}

            {/* Mobile swipe hint or view details */}
            {isMobile ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onViewDetails}
                className="flex-1 text-primary hover:text-primary/80"
              >
                {!swipeState.isSwiping && (
                  <>
                    <span className="text-xs">Swipe for actions</span>
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={onViewDetails}
                className="text-primary hover:text-primary/80"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Mobile swipe progress indicator */}
          {isMobile && swipeState.isSwiping && swipeProgress > 0 && (
            <div className="mt-3 h-1 bg-muted/20 rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full transition-all duration-100',
                  showLeftAction && 'bg-gradient-to-r from-red-400 to-red-500',
                  showRightAction && 'bg-gradient-to-r from-green-400 to-green-500'
                )}
                style={{ width: `${swipeProgress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SwipeableLeadCard;

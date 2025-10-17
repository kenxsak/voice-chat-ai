'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Bot, 
  BookOpen, 
  HelpCircle, 
  Zap, 
  FileText, 
  Globe, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

export function HelpDocumentation() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="getting-started">
            <Zap className="w-4 h-4 mr-2" />
            Getting Started
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="training">
            <BookOpen className="w-4 h-4 mr-2" />
            Training
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQ
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[600px] pr-4">
          {/* Getting Started */}
          <TabsContent value="getting-started">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Getting Started Guide
                </CardTitle>
                <CardDescription>
                  Learn how to set up your account and create your first AI chatbot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Step 1: Account Setup
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>Initial Setup:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Access the dashboard with your admin credentials</li>
                          <li>Navigate to <Badge variant="outline">General Settings</Badge></li>
                          <li>Fill in your company details, including name and description</li>
                          <li>Upload your company logo (recommended: 200x200px PNG or SVG)</li>
                          <li>Choose your brand color to customize the chatbot appearance</li>
                        </ul>
                        <p className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                          <Info className="w-4 h-4 inline mr-2" />
                          <strong>Tip:</strong> Your company details will be used as fallback information if specific agents don't have descriptions.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Step 2: Create Your First Agent
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>Agent Creation:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Go to <Badge variant="outline">Agents</Badge> tab</li>
                          <li>Click <Badge>Add New Agent</Badge></li>
                          <li>Enter agent name (e.g., "Customer Support Bot", "Sales Assistant")</li>
                          <li>Write a clear agent description defining its role</li>
                          <li>Upload an agent avatar (optional but recommended)</li>
                          <li>Configure tone, response style, and expertise level</li>
                        </ul>
                        <p className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          <strong>Important:</strong> Keep agent descriptions concise and role-focused. Don't duplicate company information here.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Step 3: Add Training Data
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>Training Your Agent:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Navigate to <Badge variant="outline">Training</Badge> tab</li>
                          <li>Select the agent you want to train</li>
                          <li>Choose training method:
                            <ul className="list-circle list-inside ml-6 mt-2">
                              <li><strong>Upload File:</strong> PDF or TXT documents</li>
                              <li><strong>Add Website:</strong> Single webpage URL</li>
                              <li><strong>Crawl Website:</strong> Multiple pages from a domain</li>
                            </ul>
                          </li>
                          <li>Wait for processing to complete</li>
                          <li>Verify the training data appears in the list</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Step 4: Embed Your Chatbot
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>Embedding Options:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Go to <Badge variant="outline">Embed</Badge> tab</li>
                          <li>Customize widget appearance:
                            <ul className="list-circle list-inside ml-6 mt-2">
                              <li>Position (bottom-right, bottom-left, etc.)</li>
                              <li>Size and margin</li>
                              <li>Launcher button style and icon</li>
                              <li>Shadow and z-index</li>
                            </ul>
                          </li>
                          <li>Copy the embed code</li>
                          <li>Paste it before the closing <code>&lt;/body&gt;</code> tag on your website</li>
                          <li>Test the widget on your site</li>
                        </ul>
                        <p className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                          <CheckCircle className="w-4 h-4 inline mr-2" />
                          <strong>Success:</strong> Your chatbot is now live! Monitor conversations in the Analytics tab.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration */}
          <TabsContent value="configuration">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuration Guide
                </CardTitle>
                <CardDescription>
                  Advanced settings and customization options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="config-1">
                    <AccordionTrigger>General Settings</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>Company Details:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li><strong>Company Name:</strong> Your organization name</li>
                          <li><strong>Company Details:</strong> Brief description of your business (used as fallback)</li>
                          <li><strong>Company Logo:</strong> Your brand logo for the chatbot</li>
                          <li><strong>Brand Color:</strong> Primary color for UI elements</li>
                          <li><strong>Company Website URL:</strong> Link for branding purposes</li>
                        </ul>
                        <p className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm">
                          <Info className="w-4 h-4 inline mr-2" />
                          Company Details are only used when an agent doesn't have a specific description.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="config-2">
                    <AccordionTrigger>Agent Configuration</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>Professional Training Options:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li><strong>Tone:</strong> Professional, Friendly, Casual, Formal, or Enthusiastic</li>
                          <li><strong>Response Style:</strong> Concise, Detailed, Conversational, or Technical</li>
                          <li><strong>Expertise Level:</strong> Beginner-friendly, Intermediate, Expert, or Technical</li>
                          <li><strong>Custom Instructions:</strong> Specific behavioral guidelines (optional)</li>
                          <li><strong>Voice:</strong> Text-to-speech voice for audio responses</li>
                        </ul>
                        <p className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md text-sm">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          Avoid duplicating information between Agent Description, Custom Instructions, and Training Data.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="config-3">
                    <AccordionTrigger>Language Settings</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>Multilingual Support:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Navigate to <Badge variant="outline">Languages</Badge> tab</li>
                          <li>Select languages to enable for your chatbot</li>
                          <li>Users can choose their preferred language from the widget</li>
                          <li>Responses are automatically translated</li>
                        </ul>
                        <p className="mt-3 text-muted-foreground">
                          Note: Available languages depend on your subscription plan.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="config-4">
                    <AccordionTrigger>Webhook Configuration</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>Lead Notifications:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Enter your webhook URL in General Settings</li>
                          <li>Receive real-time notifications when leads are captured</li>
                          <li>Webhook payload includes:
                            <ul className="list-circle list-inside ml-6 mt-2">
                              <li>Lead name, email, phone</li>
                              <li>Conversation summary</li>
                              <li>Full conversation history</li>
                              <li>Agent information</li>
                            </ul>
                          </li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training */}
          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Training Data Best Practices
                </CardTitle>
                <CardDescription>
                  How to effectively train your AI agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="train-1">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Uploading Documents
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>Supported Formats:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li><strong>PDF:</strong> Product manuals, guides, FAQs</li>
                          <li><strong>TXT:</strong> Plain text documentation</li>
                        </ul>
                        <p className="mt-3"><strong>Best Practices:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li>Ensure documents are text-based (not scanned images)</li>
                          <li>Keep documents focused on specific topics</li>
                          <li>Use clear headings and structure</li>
                          <li>Remove unnecessary formatting</li>
                          <li>Limit document size to 10MB or less</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="train-2">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Adding Websites
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>Website Training Options:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li><strong>Add Website:</strong> Extract content from a single URL</li>
                          <li><strong>Crawl Website:</strong> Automatically discover and process multiple pages
                            <ul className="list-circle list-inside ml-6 mt-2">
                              <li>Set maximum pages (1-50)</li>
                              <li>Crawler follows internal links</li>
                              <li>Respects robots.txt</li>
                            </ul>
                          </li>
                        </ul>
                        <p className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                          <Info className="w-4 h-4 inline mr-2" />
                          <strong>Tip:</strong> Website crawling is ideal for documentation sites, help centers, and product catalogs.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="train-3">
                    <AccordionTrigger>Avoiding Context Duplication</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>The Golden Rule:</strong> Each piece of information should appear in EXACTLY ONE place.</p>
                        
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-md">
                          <p className="font-semibold text-red-700 dark:text-red-400">❌ DON'T:</p>
                          <ul className="list-disc list-inside ml-4 mt-2">
                            <li>Copy company details to agent description</li>
                            <li>Repeat agent identity in training documents</li>
                            <li>Duplicate custom instructions in training data</li>
                          </ul>
                        </div>

                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                          <p className="font-semibold text-green-700 dark:text-green-400">✅ DO:</p>
                          <ul className="list-disc list-inside ml-4 mt-2">
                            <li><strong>Identity:</strong> Agent Description only</li>
                            <li><strong>Behavior:</strong> Custom Instructions only</li>
                            <li><strong>Knowledge:</strong> Training Data only</li>
                            <li><strong>Company Info:</strong> Company Details (fallback)</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="train-4">
                    <AccordionTrigger>Managing Training Data</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 text-sm">
                        <p><strong>Data Management:</strong></p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                          <li><strong>View:</strong> See all training contexts for each agent</li>
                          <li><strong>Edit:</strong> Update existing training content</li>
                          <li><strong>Delete:</strong> Remove outdated or incorrect data</li>
                          <li><strong>Select All:</strong> Bulk operations available</li>
                        </ul>
                        <p className="mt-3 text-muted-foreground">
                          Training data limits depend on your subscription plan. Check your plan details for current limits.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Common questions and troubleshooting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="faq-1">
                    <AccordionTrigger>Why does my chatbot show "N/A" for Website Context?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <p>This typically happens when:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>No training data has been added to your agent</li>
                          <li>Training data is being processed</li>
                          <li>The conversation was started before training data was added</li>
                        </ul>
                        <p className="mt-3"><strong>Solution:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                          <li>Add training data (documents or websites) to your agent</li>
                          <li>Wait for processing to complete</li>
                          <li>Start a new conversation to see the updated context</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-2">
                    <AccordionTrigger>How do I change my chatbot's welcome message?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <ol className="list-decimal list-inside space-y-2">
                          <li>Go to the <Badge variant="outline">Agents</Badge> tab</li>
                          <li>Click <Badge>Edit</Badge> on your agent</li>
                          <li>Find the <strong>Greeting</strong> field</li>
                          <li>Enter your custom welcome message</li>
                          <li>Click <Badge>Save Changes</Badge></li>
                        </ol>
                        <p className="mt-3 text-muted-foreground">
                          The greeting appears when users first open the chat widget.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-3">
                    <AccordionTrigger>My chatbot isn't appearing on my website. What should I do?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>Troubleshooting Steps:</strong></p>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                          <li>Verify the embed code is placed before <code>&lt;/body&gt;</code></li>
                          <li>Check browser console for errors (F12 or right-click → Inspect)</li>
                          <li>Ensure your website allows iframe embedding</li>
                          <li>Clear browser cache and hard refresh (Ctrl+F5)</li>
                          <li>Verify your subscription is active</li>
                          <li>Check if Content Security Policy (CSP) blocks the widget</li>
                        </ol>
                        <p className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                          <Info className="w-4 h-4 inline mr-2" />
                          If issues persist, use the AI Help Assistant or contact support.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-4">
                    <AccordionTrigger>How do I upgrade my plan?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <ol className="list-decimal list-inside space-y-2">
                          <li>Navigate to <Badge variant="outline">Subscription</Badge> tab</li>
                          <li>Review available plans and their features</li>
                          <li>Click <Badge>Upgrade</Badge> on your desired plan</li>
                          <li>Follow the payment process</li>
                          <li>Your new features activate immediately</li>
                        </ol>
                        <p className="mt-3 text-muted-foreground">
                          Plan changes are prorated based on your billing cycle.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-5">
                    <AccordionTrigger>Can I have multiple agents with different personalities?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>Yes!</strong> You can create multiple agents with different:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Names and descriptions</li>
                          <li>Tones (professional, friendly, casual, etc.)</li>
                          <li>Response styles (concise, detailed, etc.)</li>
                          <li>Training data (each agent has its own knowledge base)</li>
                          <li>Avatars and visual customization</li>
                        </ul>
                        <p className="mt-3 text-muted-foreground">
                          The number of agents you can create depends on your subscription plan.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-6">
                    <AccordionTrigger>How do I export conversation data?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>Export Options:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>Go to <Badge variant="outline">Analytics</Badge> tab</li>
                          <li>Use filters to select specific conversations or leads</li>
                          <li>Click the export/download button (if available)</li>
                          <li>Data includes conversation history, timestamps, and contact info</li>
                        </ul>
                        <p className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm">
                          <Info className="w-4 h-4 inline mr-2" />
                          Alternatively, configure webhooks to receive real-time data in your own systems.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-7">
                    <AccordionTrigger>What languages are supported?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <p>The platform supports 50+ languages including:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>English, Spanish, French, German, Italian</li>
                          <li>Hindi, Bengali, Tamil, Telugu (Indian languages)</li>
                          <li>Chinese (Simplified & Traditional), Japanese, Korean</li>
                          <li>Arabic, Portuguese, Russian, and many more</li>
                        </ul>
                        <p className="mt-3 text-muted-foreground">
                          Available languages depend on your plan. Free plan includes English only.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-8">
                    <AccordionTrigger>How is my data secured?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>Security Measures:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>All data encrypted in transit (HTTPS/TLS)</li>
                          <li>Secure database storage with access controls</li>
                          <li>Regular security audits and updates</li>
                          <li>Data isolation between tenants</li>
                          <li>GDPR and privacy compliance</li>
                        </ul>
                        <p className="mt-3 text-muted-foreground">
                          We never share your data with third parties without explicit consent.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-9">
                    <AccordionTrigger>Can I customize the chatbot's appearance?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>Customization Options:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li><strong>Brand Color:</strong> Primary color for UI elements</li>
                          <li><strong>Logo:</strong> Your company logo in the chat header</li>
                          <li><strong>Agent Avatar:</strong> Custom avatar for each agent</li>
                          <li><strong>Position:</strong> Corner placement on your website</li>
                          <li><strong>Launcher Button:</strong> Icon, size, style, animation</li>
                          <li><strong>Widget Size:</strong> Small, medium, or large</li>
                        </ul>
                        <p className="mt-3 text-muted-foreground">
                          Premium plans offer custom branding without platform watermarks.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-10">
                    <AccordionTrigger>How do I monitor chatbot performance?</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <p><strong>Analytics Dashboard:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                          <li>View total conversations and leads</li>
                          <li>Monitor usage against plan limits</li>
                          <li>Review conversation summaries</li>
                          <li>Track lead capture rates</li>
                          <li>Analyze customer interactions</li>
                          <li>Export data for external analysis</li>
                        </ul>
                        <p className="mt-3">Access Analytics from the main navigation menu.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

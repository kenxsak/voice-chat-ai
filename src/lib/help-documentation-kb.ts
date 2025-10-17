export const HELP_DOCUMENTATION_KB = `
# VoiceChat AI Platform - Complete Help Documentation

## GETTING STARTED

### Step 1: Account Setup

**Initial Setup Process:**
- Access the dashboard with your admin credentials
- Navigate to General Settings tab
- Fill in your company details, including name and description
- Upload your company logo (recommended: 200x200px PNG or SVG)
- Choose your brand color to customize the chatbot appearance

**Important:** Your company details will be used as fallback information if specific agents don't have descriptions.

### Step 2: Create Your First Agent

**Agent Creation Process:**
- Go to Agents tab
- Click Add New Agent button
- Enter agent name (e.g., "Customer Support Bot", "Sales Assistant")
- Write a clear agent description defining its role
- Upload an agent avatar (optional but recommended)
- Configure tone, response style, and expertise level

**Important:** Keep agent descriptions concise and role-focused. Don't duplicate company information in agent descriptions.

### Step 3: Add Training Data

**Training Your Agent:**
- Navigate to Training tab
- Select the agent you want to train
- Choose training method:
  - Upload File: PDF or TXT documents
  - Add Website: Single webpage URL
  - Crawl Website: Multiple pages from a domain
- Wait for processing to complete
- Verify the training data appears in the list

### Step 4: Embed Your Chatbot

**Embedding Options:**
- Go to Embed tab
- Customize widget appearance:
  - Position (bottom-right, bottom-left, top-right, top-left)
  - Size and margin settings
  - Launcher button style and icon
  - Shadow and z-index configuration
- Copy the embed code
- Paste it before the closing </body> tag on your website
- Test the widget on your site

**Success:** Your chatbot is now live! Monitor conversations in the Analytics tab.

## CONFIGURATION GUIDE

### General Settings

**Company Details:**
- Company Name: Your organization name
- Company Details: Brief description of your business (used as fallback)
- Company Logo: Your brand logo for the chatbot
- Brand Color: Primary color for UI elements
- Company Website URL: Link for branding purposes

**Note:** Company Details are only used when an agent doesn't have a specific description.

### Agent Configuration

**Professional Training Options:**
- Tone: Professional, Friendly, Casual, Formal, or Enthusiastic
- Response Style: Concise, Detailed, Conversational, or Technical
- Expertise Level: Beginner-friendly, Intermediate, Expert, or Technical
- Custom Instructions: Specific behavioral guidelines (optional)
- Voice: Text-to-speech voice for audio responses

**Important:** Avoid duplicating information between Agent Description, Custom Instructions, and Training Data.

### Language Settings

**Multilingual Support:**
- Navigate to Languages tab
- Select languages to enable for your chatbot
- Users can choose their preferred language from the widget
- Responses are automatically translated

**Note:** Available languages depend on your subscription plan.

### Webhook Configuration

**Lead Notifications:**
- Enter your webhook URL in General Settings
- Receive real-time notifications when leads are captured
- Webhook payload includes:
  - Lead name, email, phone
  - Conversation summary
  - Full conversation history
  - Agent information

## TRAINING DATA BEST PRACTICES

### Uploading Documents

**Supported Formats:**
- PDF: Product manuals, guides, FAQs
- TXT: Plain text documentation

**Best Practices:**
- Ensure documents are text-based (not scanned images)
- Keep documents focused on specific topics
- Use clear headings and structure
- Remove unnecessary formatting
- Limit document size to 10MB or less

### Adding Websites

**Website Training Options:**
- Add Website: Extract content from a single URL
- Crawl Website: Automatically discover and process multiple pages
  - Set maximum pages (1-50)
  - Crawler follows internal links
  - Respects robots.txt

**Tip:** Website crawling is ideal for documentation sites, help centers, and product catalogs.

### Avoiding Context Duplication

**The Golden Rule:** Each piece of information should appear in EXACTLY ONE place.

**DON'T:**
- Copy company details to agent description
- Repeat agent identity in training documents
- Duplicate custom instructions in training data

**DO:**
- Identity: Agent Description only
- Behavior: Custom Instructions only
- Knowledge: Training Data only
- Company Info: Company Details (fallback)

### Managing Training Data

**Data Management:**
- View: See all training contexts for each agent
- Edit: Update existing training content
- Delete: Remove outdated or incorrect data
- Select All: Bulk operations available

**Note:** Training data limits depend on your subscription plan.

## FREQUENTLY ASKED QUESTIONS

### Why does my chatbot show "N/A" for Website Context?

This typically happens when:
- No training data has been added to your agent
- Training data is being processed
- The conversation was started before training data was added

**Solution:**
- Add training data (documents or websites) to your agent
- Wait for processing to complete
- Start a new conversation to see the updated context

### How do I change my chatbot's welcome message?

1. Go to the Agents tab
2. Click Edit on your agent
3. Find the Greeting field
4. Enter your custom welcome message
5. Click Save Changes

The greeting appears when users first open the chat widget.

### My chatbot isn't appearing on my website. What should I do?

**Troubleshooting Steps:**
1. Verify the embed code is placed before </body>
2. Check browser console for errors (F12 or right-click → Inspect)
3. Ensure your website allows iframe embedding
4. Clear browser cache and hard refresh (Ctrl+F5)
5. Verify your subscription is active
6. Check if Content Security Policy (CSP) blocks the widget

If issues persist, use the AI Help Assistant or contact support.

### How do I upgrade my plan?

1. Navigate to Subscription tab
2. Review available plans and their features
3. Click Upgrade on your desired plan
4. Follow the payment process
5. Your new features activate immediately

**Note:** Plan changes are prorated based on your billing cycle.

### Can I have multiple agents with different personalities?

**Yes!** You can create multiple agents with different:
- Names and descriptions
- Tones (professional, friendly, casual, etc.)
- Response styles (concise, detailed, etc.)
- Training data (each agent has its own knowledge base)
- Avatars and visual customization

The number of agents you can create depends on your subscription plan.

### How do I export conversation data?

**Export Options:**
- Go to Analytics tab
- Use filters to select specific conversations or leads
- Click the export/download button (if available)
- Data includes conversation history, timestamps, and contact info

**Tip:** Configure webhooks to receive real-time data in your own systems.

### What languages are supported?

The platform supports 109 languages including:
- **European Languages**: English, Spanish, French, German, Italian, Portuguese, Dutch, Polish, Swedish, Norwegian, Danish, Finnish, Greek, Romanian, Czech, Hungarian, and more
- **Asian Languages**: Chinese (Simplified & Traditional), Japanese, Korean, Hindi, Bengali, Tamil, Telugu, Urdu, Thai, Vietnamese, Indonesian, Malay, Tagalog, and more
- **Middle Eastern Languages**: Arabic, Hebrew, Persian (Farsi), Turkish, and more
- **African Languages**: Swahili, Zulu, Afrikaans, and more
- **Latin American Languages**: Spanish (multiple variants), Portuguese (Brazil), and regional dialects

**RTL Support**: Fully supports right-to-left languages (Arabic, Hebrew, Persian, Urdu)

**Note:** Available languages depend on your plan:
- Free Plan: 1 language (English)
- Trial Plan: 10 languages
- Starter Plan: 10 languages
- Pro Plan: 50 languages

### How is my data secured?

**Security Measures:**
- All data encrypted in transit (HTTPS/TLS)
- Secure database storage with access controls
- Regular security audits and updates
- Data isolation between tenants
- GDPR and privacy compliance

We never share your data with third parties without explicit consent.

### Can I customize the chatbot's appearance?

**Customization Options:**
- Brand Color: Primary color for UI elements
- Logo: Your company logo in the chat header
- Agent Avatar: Custom avatar for each agent
- Position: Corner placement on your website
- Launcher Button: Icon, size, style, animation
- Widget Size: Small, medium, or large

**Note:** Premium plans offer custom branding without platform watermarks.

### How do I monitor chatbot performance?

**Analytics Dashboard:**
- View total conversations and leads
- Monitor usage against plan limits
- Review conversation summaries
- Track lead capture rates
- Analyze customer interactions
- Export data for external analysis

Access Analytics from the main navigation menu.

### What are the different subscription plans?

**Free Plan:**
- 50 conversations/month
- 5 leads/month
- 1 chatbot agent
- 1 language (English)
- 1 training context
- 50,000 AI tokens/month
- Platform branding (no logo removal)

**14-Day Trial Plan:**
- 500 conversations/month
- 50 leads/month
- 5 chatbot agents
- 10 languages
- 10 training contexts
- 500,000 AI tokens/month
- Custom branding enabled
- Automatically converts to Free plan after 14 days

**Starter Plan ($29/month):**
- 500 conversations/month
- 50 leads/month
- 5 chatbot agents
- 10 languages
- 10 training contexts
- 500,000 AI tokens/month
- Custom branding (remove platform logo)
- Priority email support

**Pro Plan ($99/month):**
- 2,000 conversations/month
- Unlimited leads
- 50 chatbot agents
- 50 languages
- 50 training contexts
- 2,000,000 AI tokens/month
- Full custom branding
- Priority support
- Advanced analytics
- Webhook integrations

### How do I add custom behavior to my agent?

Use the Custom Instructions field in Agent Configuration to add specific behavioral guidelines:
- Response patterns
- Handling specific scenarios
- Prohibited topics
- Escalation procedures
- Brand voice guidelines

**Example:** "Always offer to schedule a demo call if the user shows interest in our enterprise features."

### What happens when I reach my plan limits?

When you reach your plan limits:
- **Conversation limit**: New conversations won't start until next billing cycle or upgrade
- **Lead limit**: New leads won't be captured (conversations still work)
- **Agent limit**: Can't create more agents until you upgrade
- **Language limit**: Can't add more languages beyond your plan's limit
- **Training context limit**: Can't add more training data (documents/websites) beyond limit
- **Token limit**: Conversations will be paused when monthly AI token usage is exceeded

**Solution:** Upgrade your plan for higher limits or wait for the next billing cycle (resets monthly).

**Pro Tip**: Monitor your usage in the Analytics dashboard to avoid hitting limits. The system will show warnings when you're approaching 80% of any limit.

### How do I delete or edit training data?

1. Go to Training tab
2. Select the agent
3. Find the training context you want to edit/delete
4. Click Edit to modify content or Delete to remove
5. Changes take effect immediately for new conversations

**Note:** Existing conversations won't be affected by training data changes.

### Can I integrate with CRM or other tools?

**Yes!** Integration options:
- Webhooks: Real-time lead notifications to any URL
- API: Access conversation and lead data programmatically
- Export: Download data for import into other systems
- Custom integrations available on Enterprise plan

Configure webhooks in General Settings to send lead data to your CRM, Zapier, Make, or custom endpoints.

### How do I handle multiple languages?

1. Enable languages in Languages tab
2. Users select their language from the chat widget
3. AI automatically translates responses
4. Training data is used in original language
5. Responses are translated to user's selected language

**Tip:** Add training data in your primary language - the AI handles translation automatically.

### What if my agent gives incorrect information?

**Troubleshooting:**
1. Review your training data for accuracy
2. Remove conflicting or outdated information
3. Add more specific training content
4. Use Custom Instructions to correct behavior
5. Check for context duplication between settings

**Prevention:** Regularly update training data and test your agent with common questions.

### How do I set up voice responses?

1. Go to Agent Configuration
2. Select a voice from the dropdown
3. Test different voices to find the best fit
4. Save changes

Voice responses work automatically when:
- User has audio enabled in the widget
- Browser supports audio playback
- Agent has a voice configured

### Can I have different agents for different pages?

**Yes!** When embedding:
1. Create multiple agents in your dashboard
2. Use the agentId parameter in your embed code
3. Place different embed codes on different pages
4. Each page will show its designated agent

**Example:** Sales agent on product pages, Support agent on help pages.

### How long are conversations stored?

Conversations are stored indefinitely by default. You can:
- View full conversation history in Analytics
- Export data for backup
- Delete specific conversations if needed
- Configure retention policies on Enterprise plan

All conversation data is securely encrypted and protected.

### What are AI tokens and why do they matter?

**AI Tokens Explained:**
- Tokens are units of text processed by the AI (roughly 4 characters = 1 token)
- Every conversation uses tokens for both user messages and AI responses
- Example: A 100-word conversation ≈ 400 tokens
- Images count as approximately 258 tokens each

**Why Token Limits Matter:**
- Tokens directly correlate to AI processing costs
- Each plan has a monthly token allowance to ensure profitability
- When you exceed your token limit, conversations pause until next billing cycle
- Upgrading gives you higher token limits for more conversations

**Token Usage Tips:**
- Keep training data concise and relevant
- Avoid uploading duplicate or unnecessary documents
- Use context limits wisely (don't add more contexts than needed)
- Monitor token usage in Analytics dashboard

### What currencies and countries are supported?

**Global Currency Support:**
The platform supports 139+ currencies including:
- USD ($), EUR (€), GBP (£), CAD (C$), AUD (A$)
- INR (₹), JPY (¥), CNY (¥), KRW (₩)
- BRL (R$), MXN ($), ARS ($), CLP ($)
- And many more regional currencies

**Multi-Country Support:**
Platform available in 195+ countries across:
- North America (US, Canada, Mexico)
- Europe (UK, Germany, France, Spain, Italy, and more)
- Asia (India, China, Japan, Korea, Southeast Asia)
- Latin America (Brazil, Argentina, Chile, Colombia)
- Middle East (UAE, Saudi Arabia, Israel)
- Africa (South Africa, Nigeria, Kenya)
- Oceania (Australia, New Zealand)

**Automatic Localization:**
- Currency symbols auto-detect based on your country
- Language selection adapts to regional preferences
- Timezone-aware analytics and reporting
- Multi-currency pricing for subscriptions (coming soon)

### What's the difference between User Management and Tenant Management? (Super Admin)

**Understanding the Key Differences:**

**USER MANAGEMENT:**
User Management is for managing individual user accounts on the platform. Each user has:
- Email address (login credentials)
- Role assignment (Super Admin, Admin, or User)
- Tenant association (which company/organization they belong to)
- Account creation date

**What Super Admins Can Do:**
- Create new user accounts with specific roles
- Assign users to tenants (organizations)
- Delete users (except themselves)
- View all users across the platform
- Filter users by role or search by email

**When to Use:**
- Creating login accounts for new administrators
- Assigning team members to specific organizations
- Managing platform access and permissions
- Removing inactive or unauthorized accounts

---

**TENANT MANAGEMENT:**
Tenant Management is for managing organizations/companies that use the platform. Each tenant has:
- Company information (name, logo, brand colors)
- Subscription plan and billing details
- Usage metrics (conversations, leads, tokens)
- AI agents and training data
- Custom settings and configurations

**What Super Admins Can Do:**
- View all tenants on the platform
- Change subscription plans and billing periods
- Manage trial periods (extend, expire, reset)
- Update tenant status (Active, Disabled)
- Monitor usage and analytics
- Track revenue and profit margins

**When to Use:**
- Managing company subscriptions
- Adjusting feature limits and trial periods
- Monitoring usage and costs
- Analyzing platform-wide performance
- Handling billing and payment issues

---

**QUICK COMPARISON:**

| Aspect | User Management | Tenant Management |
|--------|----------------|-------------------|
| What it manages | Individual login accounts | Organizations/companies |
| Key actions | Create users, assign roles, delete accounts | Manage plans, trials, billing |
| Primary focus | Access control & permissions | Subscriptions & usage |
| Example | Add a new admin for XYZ Corp | Upgrade XYZ Corp to Pro plan |

**Example Workflow:**
1. First, create a tenant (organization) in Tenant Management
2. Then, create a user account in User Management
3. Assign that user to the tenant with "Admin" role
4. The user can now log in and manage their tenant's AI agents

### How do I control costs and optimize token usage?

**Cost Control Best Practices:**

1. **Optimize Training Data:**
   - Remove duplicate documents
   - Keep website crawls focused (don't crawl entire sites)
   - Use concise, relevant content only
   - Limit training contexts to what's necessary

2. **Configure Agent Settings:**
   - Set response style to "Concise" instead of "Detailed" for cost savings
   - Use shorter custom instructions
   - Avoid redundant agent descriptions

3. **Monitor Usage:**
   - Check Analytics dashboard regularly
   - Review token usage trends
   - Set up usage alerts (Pro plan)
   - Upgrade before hitting limits to avoid service interruption

4. **Smart Plan Selection:**
   - Start with Trial to test token consumption
   - Estimate monthly usage based on expected conversation volume
   - Choose plan with 20% buffer above estimated usage
   - Pro plan offers best value for high-volume usage

**Super Admin Controls:**
- View real-time token costs per tenant
- Track profit margins
- Set custom token limits
- Receive alerts for unusual usage spikes
`;

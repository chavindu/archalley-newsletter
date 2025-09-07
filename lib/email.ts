import nodemailer from 'nodemailer'
import { stripHtmlTags } from './wordpress'

export interface EmailPost {
  id: number
  title: string
  excerpt: string
  link: string
  featured_image: string | null
  categories: string[]
  date: string
}

export interface EmailConfig {
  to: string
  subject: string
  posts: EmailPost[]
  unsubscribeToken: string
  newsletterId?: string
  subscriberEmail?: string
}

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Generate newsletter HTML template
export function generateNewsletterHTML(posts: EmailPost[], unsubscribeToken: string, newsletterId?: string, subscriberEmail?: string): string {
  const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/unsubscribe?token=${unsubscribeToken}`
  
  // Generate tracking pixel URL
  const trackingPixelUrl = newsletterId && subscriberEmail 
    ? `${process.env.NEXTAUTH_URL}/api/track/open?newsletterId=${newsletterId}&email=${encodeURIComponent(subscriberEmail)}`
    : ''
  
  // Helper function to wrap links with click tracking
  const wrapLinkWithTracking = (url: string, linkText: string) => {
    if (!newsletterId || !subscriberEmail) {
      return `<a href="${url}">${linkText}</a>`
    }
    const trackedUrl = `${process.env.NEXTAUTH_URL}/api/track/click?newsletterId=${newsletterId}&email=${encodeURIComponent(subscriberEmail)}&url=${encodeURIComponent(url)}`
    return `<a href="${trackedUrl}">${linkText}</a>`
  }
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Archalley Newsletter</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        
        /* Main styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
            width: 100% !important;
            min-width: 100%;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            width: 100%;
        }
        
        .header {
            background-color: #FFA500;
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        
        .logo-img {
            max-width: 200px;
            height: auto;
            margin-bottom: 10px;
            display: block;
        }
        
        .tagline {
            font-size: 14px;
            margin: 5px 0 0 0;
            color: white;
        }
        
        .content {
            padding: 30px 20px;
        }
        
        .post-card {
            margin-bottom: 30px;
            background: white;
            border: 1px solid #e0e0e0;
        }
        
        .post-card:last-child {
            margin-bottom: 0;
        }
        
        .post-content-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .post-text-cell {
            padding: 25px;
            vertical-align: top;
            width: 60%;
        }
        
        .post-image-cell {
            padding: 0;
            vertical-align: top;
            width: 40%;
            background: #f8f9fa;
        }
        
        .post-image {
            width: 100%;
            height: 200px;
            display: block;
        }
        
        .post-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin: 0 0 10px 0;
            text-decoration: none;
            line-height: 1.3;
        }
        
        .post-title a {
            color: #333;
            text-decoration: none;
        }
        
        .post-meta {
            margin-bottom: 15px;
        }
        
        .post-date {
            color: #666;
            font-size: 14px;
        }
        
        .post-excerpt {
            color: #555;
            font-size: 14px;
            margin-bottom: 15px;
            line-height: 1.5;
        }
        
        .read-more {
            display: inline-block;
            background-color: #FFA500;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            font-weight: bold;
            font-size: 14px;
        }
        
        .read-more:hover {
            background-color: #e69500;
        }
        
        .footer {
            background-color: #333;
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        
        .footer p {
            margin: 5px 0;
            font-size: 14px;
        }
        
        .footer a {
            color: #FFA500;
            text-decoration: none;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            text-decoration: none;
        }
        
        .social-icon-img {
            width: 32px;
            height: 32px;
            display: block;
        }
        
        .unsubscribe {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #555;
        }
        
        /* Mobile styles */
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }
            .header {
                padding: 20px 15px;
            }
            .content {
                padding: 20px 15px;
            }
            .post-text-cell {
                padding: 20px;
                width: 100% !important;
                display: block !important;
            }
            .post-image-cell {
                width: 100% !important;
                display: block !important;
            }
            .post-image {
                height: 150px;
            }
            .post-title {
                font-size: 18px;
            }
            .logo-img {
                max-width: 150px;
            }
        }
        
        /* Gmail specific fixes */
        .gmail-fix {
            display: none;
            display: none !important;
        }
        
        /* Gmail mobile fixes */
        @media screen and (max-width: 600px) {
            .post-content-table {
                width: 100% !important;
            }
            .post-text-cell, .post-image-cell {
                display: block !important;
                width: 100% !important;
            }
        }
        
        /* Gmail dark mode fixes */
        @media (prefers-color-scheme: dark) {
            .post-card {
                background-color: #ffffff !important;
                color: #000000 !important;
            }
            .post-title, .post-excerpt, .post-date {
                color: #000000 !important;
            }
        }
        
        /* Outlook specific fixes */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
            .container {
                max-width: 600px !important;
            }
        }
        
        /* Force Gmail to respect table widths */
        .post-content-table[class="post-content-table"] {
            width: 100% !important;
        }
        
        /* Gmail image fixes */
        .post-image[class="post-image"] {
            width: 100% !important;
            height: auto !important;
            max-width: 200px !important;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${process.env.NEXTAUTH_URL}/images/archalley-logo.webp" alt="Archalley" class="logo-img" />
            <p class="tagline">Architecture & Design Newsletter</p>
        </div>
        
        <div class="content">
            ${posts.map((post, index) => `
                <div class="post-card">
                    <table class="post-content-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%;">
                        <tr>
                            ${index % 2 === 0 ? `
                            <td class="post-text-cell" width="60%" style="width: 60%;">
                                <h2 class="post-title">${wrapLinkWithTracking(post.link, post.title)}</h2>
                                <div class="post-meta">
                                    <span class="post-date">${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <p class="post-excerpt">${post.excerpt}</p>
                                ${wrapLinkWithTracking(post.link, '<span class="read-more">Read Full Article</span>')}
                            </td>
                            <td class="post-image-cell" width="40%" style="width: 40%;">
                                ${post.featured_image ? `
                                    <img src="${post.featured_image}" alt="${post.title}" class="post-image">
                                ` : `
                                    <div style="color: #ccc; font-size: 14px; text-align: center; padding: 50px 20px;">No Image</div>
                                `}
                            </td>
                            ` : `
                            <td class="post-image-cell" width="40%" style="width: 40%;">
                                ${post.featured_image ? `
                                    <img src="${post.featured_image}" alt="${post.title}" class="post-image">
                                ` : `
                                    <div style="color: #ccc; font-size: 14px; text-align: center; padding: 50px 20px;">No Image</div>
                                `}
                            </td>
                            <td class="post-text-cell" width="60%" style="width: 60%;">
                                <h2 class="post-title">${wrapLinkWithTracking(post.link, post.title)}</h2>
                                <div class="post-meta">
                                    <span class="post-date">${new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <p class="post-excerpt">${post.excerpt}</p>
                                ${wrapLinkWithTracking(post.link, '<span class="read-more">Read Full Article</span>')}
                            </td>
                            `}
                        </tr>
                    </table>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p><strong>Archalley</strong> - Your source for architecture and design inspiration</p>
            <p>Visit us at <a href="https://archalley.com">archalley.com</a></p>
            
            <div class="social-links">
                <a href="https://web.facebook.com/archalley" title="Facebook">
                    <img src="${process.env.NEXTAUTH_URL}/images/iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACi0lEQVR4nO2ZsU8UURCHV0ULlBhjZaGSiKU29CRqAMXCoKKJVnbGf8BGE4IJEkMjhTY2xkJRG9QzRG3sCI0XowF7O0EQRcDiPjPhkWyx9+693dndd8n9kpdcsTu/+W53Z+fNRlFLLYUtYA8wAIwBr4F54Cfwzyz5PQe8Au4CZ+ScKAQB20xCz4F1/LUGTAKnJVZUEsQQ8Bk9VYHzRQIcBT6Qn94BXXlDXACWyV8rwJW8noVhiteY2rNjIB5Snh6owJhSWbbuZIW4TDi6mqU6/VZKQt4Xj0zJlrj7gb3APqATOAaMN4jxCziSBkSrxL4HDjj4XXOINe0LcVEJogK0OXq6gIgGfaqUxht7QW4hjz/PFeSTUxUzvZOGRl0hPEFE/S4BpQHU0HGLRzcwYby21qxH7KeNIDpSdrFJFWaHBWIjY/y/QLsNRPYTGqpaPB4refTZQKS30dBHi8f33J9BNnd2GnprqYiyW9TQlA3km5JJpU78Xehpzgay2EQgP2wgWatJkSDr2iCDpvmLr7rTkYRjt9Y9T98NG8hSCpDeSEHAM0/fBVuw+RJBpIfy0VdbsEoZIMB2YFWz/I6WBHJYdfsLnE0R8Ibpn+Kry/JC7E5Y11P49ttA2oE/hF9+V4HdjS7ziyYAmbRCGLO+JgA55QIi9/GXgEGqDSFihucCBhlwBlEYB+UFMu0FYUw7zVQ8FJBl4JA3iDGWhrAWAEgNuJQKImY+EgDIcCaIWAL3SwQZV4GIJXHT4zbTAKmpXYk6n96WCgBZdJ7xZuxU3+QIMgUczBUioVOeVQSZkblzYQAJyfUAT8yY1BdkxUwee6JQxGaSJ4FbUhjqHLMTeAncBk7IOcVn2lJLkY/+A1tlbk1c+pFNAAAAAElFTkSuQmCC" alt="Facebook" class="social-icon-img" />
                </a>
                <a href="https://www.instagram.com/archalley_insta/" title="Instagram">
                    <img src="${process.env.NEXTAUTH_URL}/images/iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACsUlEQVR4nO2Zz04UQRCH54Be3ADe8WCE1cSLUfBgxIPgGfBVFH0BiHIUPfgnoO9ghMCyREx8BEXu60nFCAa9LB+pWBMnm0zPTPdAzSb7SybZw1R1f9vV1TVdUdRTT/YCLgIPgQ1gG/hNeRJf4rMBPJCxjgNgFGhy8voI3CgD4BTwDDjETofAU6DPF+IssEl11JQ5+ayERShl6QNwugiIhFNVtVhkY1vuiSzJ3K7lAaliSHWqkeecsNQ7YEiflYx3R1wgcthZaigxl3MZ7866QORU7RaQdRfITgmT+QEsAVMaqmf0kd/TwDKwm2K7ogDyrGaM88UFshcAcADMAf3OjfhvnAFgXm18tecawFetZEoE7gCv5F/TYjAuCF8Ckx2pXmy9FJUM0opjG6gDWzls3sdZRzNUyxrkIF4J4JYj9tP20rjajgF/LEHmEitRBCIJM6w+HluByCQG1C5POKVpU30MFv0zygJZSmzsUE2or9cWIFNqI9kpVC/U14wFSF1tJMWGatun1otKAqmpzT7h2ldftW4H+aW++rs9tD5bhta02kjZEarn6uuuBciy2kwSrtvq6431gSi1k6+aiQPxpwWIaF7tzgPfAkuUhaLGZYJIoTeqtuM6sbz6DtxU2+vWRWNnGT+c83ZSbmouqI18DX7FQ1HJIDHMWMLPhJQdklb1nJHnk2SneGMnVsILIgsk5FNXQuORbNrUAf6PM6h74u9xferuEK5drWKlALykZUdNf89oii2UnXwuH6yvg4pozQUinaJu0T0XyAjdo3rWRpT+YNW17oRQkCtAm+qqnautoDDSs6uqnuSCUJC+iobYVqHWW6IZWqWmz0aew9a1MovGrbi2hJN3e7oD6DLw1gCiAVwNBkg5Z2Yl/entehkXD7HElxSZa8B9Z2utp56iE9MRhEQQu0zJ/tkAAAAASUVORK5CYII=" alt="Instagram" class="social-icon-img" />
                </a>
                <a href="https://www.youtube.com/@archalleytube" title="YouTube">
                    <img src="${process.env.NEXTAUTH_URL}/images/iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB+0lEQVR4nO3ZTYhNYRjA8WtQdkRjKbPysVEWbJTNRDY29kwUWSkrxYJSs5alpVJGKQurGc1CqclHk48kNUlmQRpEhmH66eRV13Xd99x7zpk5t95/3dWt5zn/c9/nvk/P02gkEolEIpHIB1ZjGw7iJC7gCm5iAg/wEm8xFz5f/c3npu9m8RxTGMd1XMY5jGAfNpX18JtxEY+xYHn4hEmcwJpeJI7ii3rxFNu7kciOz6J68gqDeSRW4rV6M5pHZIf6M5NH5JD+YG1M5LT+YFdM5JL+4EhM5FbBBMN4YrkLHveKRA8xVuE43qmOazGR6SLRW2KtD0f1h/IZj4lk/VLP/CfmFtxWLtMxkayZ65lI7OHQZpTBbEzkY1UiTV30KXwoKPIdKzolWqhSpE39/KzkUrR0IhtKEFnXKUGhn7yLo1XoCPvdnQ90SvSm4mJ/phzmYm/sRdki2FrB3+9MTORRkehLeCE+jIncLRK9pQ6yIUNV3ImJ3CiY4ECYjlTN1ZjIqP7gfEzkmP7gcExkr/5gT0xksMajoD8s5h0JZSPQOjMRlQgiO9vMbevCN+zOJRJk9oeBdJ14n01Bc0u01MsZ3Mf8Mj38fMh/Fhu7lmgjNYChMO4fCeP/bA0wFtYCU+EinG1aHWRrhLxrhbE2a4Whjh1uIpFIJBKJxj/8AkQxUQ7lEryoAAAAAElFTkSuQmCC" alt="YouTube" class="social-icon-img" />
                </a>
                <a href="https://www.tiktok.com/@archalley.com" title="TikTok">
                    <img src="${process.env.NEXTAUTH_URL}/images/iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB20lEQVR4nO2Zu0oDQRRAV0TEwsTE5x/4DSLiozVWamfjL6hgKyaILyRW2mhjbOwEUSyitY3Y+AeCleJmg43okYENhGHX3TUbcifsKcPce/dwczMzG8tKSEj4F8AccA9UaT1V4A7IRZXYQi6FKJ2QTi6MiPo6SaccRsRBPpUwIkZgJSKNM6TVeWgXkb12ERkFvkwUGfSotWOiyIBHrU7gwngRBdABrAF2lGRWEM3zoD+gbgpYAg6BH8ki2cDiLsC3ZJGMVmfFVJGsVqcCrKoZMb0jjvv5LTBVL0QLRdQvzgEwWdv4PE7RfT4iNV7cW+BFq4a95LNHRBWJRNwim3/k0R80LVXkPCCPESK2z9lpAbgCnjwGNiVRpOgRdxQQI1JkRouZDxHTK1FkRIu5NFWkS4t5DBHTo8V8ShAZjtiRV219uhGJOEWmI85IXls/hhCRokfcsc/aG6BbW7stRcT22UcWgWvg2T0MLqvrrLYmA7xJEVGUApN55z8hBqwYRRQbESXW45BohojizO/FQl3OLHBKjFhNEFF8APvARO0m6M7COLALvBMzVpNEdAIvRqaIIEHEQT52GBF1b26Lv95yyGc2UMSVKSCXfCgJrTNlITPjuM8SrhMJCQmWzi9p0S+0a9LCmQAAAABJRU5ErkJggg==" alt="TikTok" class="social-icon-img" />
                </a>
                <a href="https://www.pinterest.com/archalleypins/" title="Pinterest">
                    <img src="${process.env.NEXTAUTH_URL}/images/iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAETklEQVR4nO2aW4hWVRTHvxwnFTUsGRWkFOzigwSBiEoIXioD7xBo4qOKgiQ++FSSaOaMog5SDz1V4kPR0zQXRrwFSWkzClk5lliZgmaFoaPmZX6ycH9x3K7z7bX3fDOfhX8YGGeftfb6n7P2um0LhYf4nwJ4HJgHbAGagA7gL+Af9yO/n3Br8sxcYEjhQQDQD1gMtAK3iIfItACvi65CBQgMANYA5ygfzgKrgf69ReJV4BQ9h5+AV3rajerpPXwsX77cJIYDbfQ+jgDDykVitPvclcKPYkN3SdS4MFppnAJGpJLoXyF3KuVm8SEaeJ90/AnsAXYB24C3gB3AbqAduJ2od2dKiI3FRWADMBGoCugfBiwBjibs83JMsovJE5fdGx8c9bbu7vUIMBv4JfLw97Mol4xthRAeF0tA2fMJoDFi3zcsSc9adoivD83R8wLwpktqUks1Ax8CK4BROTJ9gE+Ne/9W8qu4AtCCC8CTivwMg9/fckFgZE6k/NJow6JSRKSKjT5wztffIQ7nJTAoNjzjyv4Qmkv1E5ZSfK8iW0ca/gDGKPq2GmRvAo9pRKQpsmCKJzcL6PKekX9/C5xU1ny0KrY8ZZATzC4kvgU5G328A/qd94wY/3zmmReBvwN6NRf7xmBPnUbEEv4+8mSmeeudOa7ybkDv5gQZwecaEUk0IazxZKT3DpYQwIKA3gOKzEqDPR3aZnLwQljsyTR46zNziEg5UgonFJm5BnsuaptZQt4sT+aQt/5sDpFNAb0nFZn5Bnuua5uJf4ew1JORjJ3F2BwiXwX0HlZklqUS+dUguNGTqfXWX8qpo0L56RNFbl2qa0ntFMIhT2aKt75J0bvIoHetItdkkLvvbGluoqHLD69eF/mZolcKxxDuqaCBKkPuETRoRNZjQ60nN6FEeJaE+XtA3xHFlpkptmQrVwuuZQ818FxmbYJSaoQwQ7GlxWjLPVG0KDwQuGFU8H1x3iSRzP3tClDt6RwUCOv3JVBgvLHOuqEWjRHnpIjTrk1tyKuKc7J/EfV+bw886opNCxpVEk7RHNLxdo5O6VWWA/td0/RBTpEoz70Xsd/CUkSqjPkk6OvydnM30knEzJXPBPW70X4spMkZ5OmR0dBU40hWZmAxWGV5O32B45GKtRDa5gjW+bNb9wUmuyGgBIkYdJgnji5jWyJHEduUsiQ7TZTff3ZnRK7frpKGLi1ch8jsjNhgQWT/kYr6KBLOmGpgn3GDpz3ZmOhjxdcxAaSguEioc5TKtq8X+cp5t1icA9QkkcgYNjJw+C+VYQAeIjGqWyQyxg0BDuZsdM571uqOVneqKQsJb5y5Xbnb+Le5ASaViUCXS5BpZ8JIaLJ3HdeZWfuiDCQ6okNsN7/OCnetcDtzz9EdSNmxqlL/A0Ii1GuuGjiWYPxNNxhc2KNuFAPXz0yXKtj12+3uLXe6nkTmZj+4sr/WzYyjb7keovAfwR1PriWmBaMTjwAAAABJRU5ErkJggg==" alt="Pinterest" class="social-icon-img" />
                </a>
                <a href="https://www.linkedin.com/company/archalleypage/" title="LinkedIn">
                    <img src="${process.env.NEXTAUTH_URL}/images/iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABQ0lEQVR4nO3ZPUoDURSG4SOKnUbQVrDQHbgHBTNoKQp2lm7BRgIuxDXYGaMuxE7xh4BOKptXrkw15GbumMLvxvPCdGfu8DB/TGLmed6vAvaBATDi7xsBt0DRFnGJbr02Z0K9bgokXE7q9VMgJfp9pkCyyBwyY5Bn4BBYrbZj4JUMITsqj2ubErI8Zr5DhpBizHyXDCFvwAmwVm3hHnkhQ4hM5pBZgljCPgkzD9W7aB1YBJaAbeAceM8BEl6cuw3HXgGu1SGbjQe3n7kF4F4W0iZgA/iShwDzCTNXshDgDHiqRh+B0wmzR5IQ4KDN9zewpQq5iyw7iMx3VCHDyLLDyPycKmSqdes5JOQQc0g0h4QcYg6J5hC17D9BSvT7SIGEf0/Vu0mBFOi31wipMD10u0hC1H5l74vcM2W4nJLPhOd5Vu8bSoiEJ4CHE4IAAAAASUVORK5CYII=" alt="LinkedIn" class="social-icon-img" />
                </a>
                <a href="https://x.com/archalley" title="X (Twitter)">
                    <img src="${process.env.NEXTAUTH_URL}/images/iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAC4klEQVR4nO2ZSWhTQRjHoxWXuqDWiltFLLij4kGooIKHgiAioS4Xe9BDRSgUPempNd606MmbC3oQRehFFMSLglRFa0VBUNxQL+LSpHXt8pOBf3AMIZkXTd6kvv8p+Wfmm/fLm/nmm/disUiRIhUsYDpwGHgA9FF69QFdQMJcS6EQW4EU/igFNBQCMYR/GnKG0XTy6U5kKglUu4CYNeG7DrmAdOO/ulxAevFfKReQslAsAvlTLXlinMZdH4EF6tdcapDvwPIcMSYATx3i/AQ2qM9GoL/UIEaPgbHACOCK5W9XnDXAQJ7NrVFtlwI9Ya6RI+ozC/gg7zMwV76pkXLuBcBM4HXAcfnXIIPW1Nhi+TeAkcAo4HaWfhd1J8cBd4JCFAPE6C0wVX1PWf4+ebUZe9NdoFKgHQWMVzQQo0vqO95a5CYhrJC/R97LdDkOtBc4VlFBjHaqf52VfR6ZhCD/LLBYn5v+Ypyig5isM08xWi3/WEb8+iBpNgwQo5tAhRZ5p5Vm6xV7UtA0GxaI0QHFmW+da94BVfJPlAtIP7BasXZbfoc8k7GelAMIutBKxbvAb+2Stwr4QRmAvLLS7DRNLbSf1Mo/6DtIElimWFOsTJV+mNGpZFCh5OAlyACwSXHWAW+AGfp+3GrXKq8G+OQjyF7FWGRd4FXVVWOAh1ZCqFPbRt9A2tW/CniW8VuTVa5/k/ccmCj/vC8glzXnzfnkVpbfvwALFX+/5Z+UNzloKR8rAsh9FYtm+pzL0e4eMFpV73XL32atqcGwQExaneNwiEorobazrYOYWUs18o+GAWL2hJXqs8PxWbH5x9erT9zyr1kJobuUICbNblb7tTp7uOqFKR5zjL8E+FoqkGarMHxPcJ3Jcw0tpQIJXbH/CSSF/0q6gJj3hcPitUIC/9U2HF699ZgzTl4QwTR4/DI07gSRAWMOST7diXggCAum2jxsVmEYxiu5Xo3d5jydIkWKFMumX0CRc456o1VnAAAAAElFTkSuQmCC" alt="X (Twitter)" class="social-icon-img" />
                </a>
            </div>
            
            <div class="unsubscribe">
                <p>Don't want to receive these emails anymore?</p>
                <p><a href="${unsubscribeUrl}">Unsubscribe here</a></p>
            </div>
        </div>
    </div>
    ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />` : ''}
</body>
</html>
  `.trim()
}

// Send newsletter email
export async function sendNewsletterEmail(config: EmailConfig): Promise<boolean> {
  try {
    console.log(`Attempting to send email to: ${config.to}`)
    console.log('SMTP Config:', {
      host: process.env.SMTP_SERVER,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USERNAME,
      from: process.env.FROM_EMAIL
    })

    const html = generateNewsletterHTML(config.posts, config.unsubscribeToken, config.newsletterId, config.subscriberEmail)
    
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: config.to,
      subject: config.subject,
      html: html,
    })

    console.log(`Email sent successfully to ${config.to}:`, info.messageId)
    return true
  } catch (error) {
    console.error(`Error sending email to ${config.to}:`, error)
    return false
  }
}

// Send newsletter to multiple recipients
export async function sendNewsletterToList(
  subject: string,
  posts: EmailPost[],
  subscribers: Array<{ email: string; unsubscribe_token: string }>,
  newsletterId?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  // Send emails in batches to avoid overwhelming the SMTP server
  const batchSize = 10
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize)
    
    const promises = batch.map(async (subscriber) => {
      const success = await sendNewsletterEmail({
        to: subscriber.email,
        subject,
        posts,
        unsubscribeToken: subscriber.unsubscribe_token,
        newsletterId,
        subscriberEmail: subscriber.email,
      })
      
      if (success) {
        sent++
      } else {
        failed++
      }
    })

    await Promise.all(promises)
    
    // Add a small delay between batches
    if (i + batchSize < subscribers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return { sent, failed }
}

// Generate welcome email HTML template
export function generateWelcomeEmailHTML(email: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Archalley Newsletter</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Roboto', Arial, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #FFA500;
            color: white;
            text-align: center;
            padding: 40px 20px;
        }
        .logo-img {
            max-width: 200px;
            height: auto;
            margin-bottom: 10px;
        }
        .tagline {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 20px;
            text-align: center;
        }
        .welcome-message {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .description {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .features {
            text-align: left;
            max-width: 400px;
            margin: 0 auto 30px;
        }
        .features ul {
            color: #555;
            padding-left: 20px;
        }
        .features li {
            margin-bottom: 10px;
        }
        .footer {
            background-color: #333;
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        .footer a {
            color: #FFA500;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${process.env.NEXTAUTH_URL}/images/archalley-logo.webp" alt="Archalley" class="logo-img" />
            <div class="tagline">Architecture & Design Newsletter</div>
        </div>
        
        <div class="content">
            <div class="welcome-message">Welcome to Archalley Newsletter!</div>
            
            <div class="description">
                Thank you for subscribing to our newsletter! We're excited to have you join our community of architecture and design enthusiasts.
            </div>
            
            <div class="features">
                <p><strong>What you can expect:</strong></p>
                <ul>
                    <li>Latest architectural news and trends</li>
                    <li>Exclusive design insights and inspiration</li>
                    <li>Special offers and announcements</li>
                    <li>Curated content from around the world</li>
                </ul>
            </div>
            
            <p style="color: #666;">
                We'll be sending you our newsletter regularly with the latest updates. 
                If you have any questions or feedback, feel free to reach out to us.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Archalley</strong> - Your source for architecture and design inspiration</p>
            <p>Visit us at <a href="https://archalley.com">archalley.com</a></p>
            <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
                You're receiving this email because you subscribed to our newsletter.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// Generate unsubscribe confirmation email HTML template
export function generateUnsubscribeEmailHTML(email: string, unsubscribeToken?: string): string {
  const resubscribeUrl = unsubscribeToken 
    ? `${process.env.NEXTAUTH_URL}/api/resubscribe?token=${unsubscribeToken}`
    : 'https://archalley.com'
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribed from Archalley Newsletter</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Roboto', Arial, sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #FFA500;
            color: white;
            text-align: center;
            padding: 40px 20px;
        }
        .logo-img {
            max-width: 200px;
            height: auto;
            margin-bottom: 10px;
        }
        .tagline {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 20px;
            text-align: center;
        }
        .unsubscribe-message {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .description {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .footer {
            background-color: #333;
            color: white;
            text-align: center;
            padding: 30px 20px;
        }
        .footer a {
            color: #FFA500;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .resubscribe-btn {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 5px;
        }
        .resubscribe-btn:hover {
            background-color: #218838;
        }
        .btn-group {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${process.env.NEXTAUTH_URL}/images/archalley-logo.webp" alt="Archalley" class="logo-img" />
            <div class="tagline">Architecture & Design Newsletter</div>
        </div>
        
        <div class="content">
            <div class="unsubscribe-message">You've been unsubscribed</div>
            
            <div class="description">
                We're sorry to see you go! You have been successfully unsubscribed from our newsletter and will no longer receive our updates.
            </div>
            
            <p style="color: #666;">
                If you unsubscribed by mistake or change your mind, you can always resubscribe by clicking the button below.
            </p>
            
            <div class="btn-group">
                <a href="${resubscribeUrl}" class="resubscribe-btn">Resubscribe to Newsletter</a>
                <a href="https://archalley.com" class="resubscribe-btn" style="background-color: #FFA500;">Visit Archalley.com</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Archalley</strong> - Your source for architecture and design inspiration</p>
            <p>Visit us at <a href="https://archalley.com">archalley.com</a></p>
            <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
                Thank you for being part of the Archalley community.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// Send welcome email to new subscriber
export async function sendWelcomeEmail(to: string): Promise<boolean> {
  try {
    console.log(`Sending welcome email to: ${to}`)
    
    const html = generateWelcomeEmailHTML(to)
    
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'Welcome to Archalley Newsletter!',
      html: html,
    })

    console.log(`Welcome email sent successfully to ${to}:`, info.messageId)
    return true
  } catch (error) {
    console.error(`Error sending welcome email to ${to}:`, error)
    return false
  }
}

// Send unsubscribe confirmation email
export async function sendUnsubscribeEmail(to: string, unsubscribeToken?: string): Promise<boolean> {
  try {
    console.log(`Sending unsubscribe confirmation email to: ${to}`)
    
    const html = generateUnsubscribeEmailHTML(to, unsubscribeToken)
    
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: 'You\'ve been unsubscribed from Archalley Newsletter',
      html: html,
    })

    console.log(`Unsubscribe confirmation email sent successfully to ${to}:`, info.messageId)
    return true
  } catch (error) {
    console.error(`Error sending unsubscribe confirmation email to ${to}:`, error)
    return false
  }
}
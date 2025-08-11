"use client";

import Script from "next/script";

type PixelsProps = {
  gaId?: string;
  metaPixelId?: string;
  linkedinPartnerId?: string;
  tiktokPixelId?: string;
};

export default function Pixels(props: PixelsProps) {
  const { gaId, metaPixelId, linkedinPartnerId, tiktokPixelId } = props;

  return (
    <>
      {/* Google Analytics 4 */}
      {gaId ? (
        <>
          <Script
            id="ga4-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);} 
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}</Script>
        </>
      ) : null}

      {/* Meta Pixel */}
      {metaPixelId ? (
        <Script id="facebook-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${metaPixelId}');
          fbq('track', 'PageView');
        `}</Script>
      ) : null}

      {/* LinkedIn Insight Tag */}
      {linkedinPartnerId ? (
        <>
          <Script id="linkedin-insight" strategy="afterInteractive">{`
            window._linkedin_partner_id = "${linkedinPartnerId}";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
          `}</Script>
          <Script id="linkedin-loader" strategy="afterInteractive">{`
            (function(){var s = document.getElementsByTagName('script')[0];
            var b = document.createElement('script');
            b.type = 'text/javascript';b.async = true;
            b.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
            s.parentNode.insertBefore(b, s);})();
          `}</Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://px.ads.linkedin.com/collect/?pid=${linkedinPartnerId}&fmt=gif`}
            />
          </noscript>
        </>
      ) : null}

      {/* TikTok Pixel */}
      {tiktokPixelId ? (
        <Script id="tiktok-pixel" strategy="afterInteractive">{`
          !function (w, d, t) {
            w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
            ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'upload'];
            ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
            for (var i = 0; i < ttq.methods.length; i++) { ttq.setAndDefer(ttq, ttq.methods[i]) }
            ttq.instance = function (t) { var e = ttq._i[t] || []; return function () { ttq.push([t].concat(Array.prototype.slice.call(arguments, 0))) } };
            ttq.load = function (e, n) { var i = 'https://analytics.tiktok.com/i18n/pixel/events.js'; ttq._t = ttq._t || {}; ttq._t[e] = +new Date; ttq._o = ttq._o || {}; ttq._o[e] = n || {}; var o = document.createElement('script'); o.type = 'text/javascript'; o.async = !0; o.src = i; var a = document.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a) };
            ttq.load('${tiktokPixelId}');
            ttq.page();
          }(window, document, 'ttq');
        `}</Script>
      ) : null}
    </>
  );
}



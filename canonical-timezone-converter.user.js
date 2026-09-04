// ==UserScript==
// @name         Canonical Timezone Converter (JST → Central)
// @namespace    https://greasyfork.org/users/TrueRyoB
// @version      0.1.0
// @description  Converts visible YYYY-MM-DD HH:mm JST timestamps to America/Chicago time.
// @author       TrueRyoB
// @license      MIT
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

/*
 * Canonical input accepted by this MVP:
 *   2026-09-04 18:30 JST
 *   2026/09/04 18:30 JST
 *   2026年09月04日 18:30
 * Seconds are optional. JST is deliberately required so ordinary numbers/dates
 * are never changed. Output uses CDT or CST according to the target's DST rule.
 */
(function () {
  'use strict';

  const SOURCE_ZONE = 'Asia/Tokyo';
  const TARGET_ZONE = 'America/Chicago';
  // Numeric dates require an explicit JST tag. The Japanese canonical form is
  // assumed to be JST, per this script's purpose.
  const TIMESTAMP = /\b(?:(\d{4})([-\/])(\d{2})\2(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s+JST\b|(\d{4})年(\d{2})月(\d{2})日\s+(\d{2}):(\d{2})(?::(\d{2}))?)/g;
  const targetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TARGET_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23', timeZoneName: 'short'
  });

  function convert(match, asciiYear, separator, asciiMonth, asciiDay, asciiHour, asciiMinute, asciiSecond,
                   japaneseYear, japaneseMonth, japaneseDay, japaneseHour, japaneseMinute, japaneseSecond) {
    const japanese = Boolean(japaneseYear);
    const year = japanese ? japaneseYear : asciiYear;
    const month = japanese ? japaneseMonth : asciiMonth;
    const day = japanese ? japaneseDay : asciiDay;
    const hour = japanese ? japaneseHour : asciiHour;
    const minute = japanese ? japaneseMinute : asciiMinute;
    const second = japanese ? japaneseSecond : asciiSecond;
    // JST is UTC+09:00 year-round. Date.UTC lets the Date constructor handle
    // day/month boundaries safely; the target formatter handles US DST safely.
    const instant = new Date(Date.UTC(+year, +month - 1, +day, +hour - 9, +minute, +(second || 0)));
    // Do not silently normalize malformed calendar values (for example Feb 30).
    if (instant.getUTCFullYear() !== +year || instant.getUTCMonth() !== +month - 1 ||
        instant.getUTCDate() !== +day || +hour > 23 || +minute > 59 || +(second || 0) > 59) {
      return match;
    }
    const parts = Object.fromEntries(targetFormatter.formatToParts(instant)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]));
    const seconds = second ? `:${parts.second}` : '';
    if (japanese) return `${parts.year}年${parts.month}月${parts.day}日 ${parts.hour}:${parts.minute}${seconds} ${parts.timeZoneName}`;
    return `${parts.year}${separator}${parts.month}${separator}${parts.day} ${parts.hour}:${parts.minute}${seconds} ${parts.timeZoneName}`;
  }

  function eligibleTextNode(node) {
    const parent = node.parentElement;
    return parent && !parent.closest('script, style, textarea, input, select, option, code, pre, [contenteditable]');
  }

  function convertTextNode(node) {
    if (!eligibleTextNode(node) || !TIMESTAMP.test(node.nodeValue)) return;
    TIMESTAMP.lastIndex = 0;
    const original = node.nodeValue;
    const converted = original.replace(TIMESTAMP, convert);
    TIMESTAMP.lastIndex = 0;
    if (converted === original) return;
    node.nodeValue = converted;
    node.parentElement.title ||= `Converted from: ${original}`;
  }

  function scan(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      convertTextNode(root);
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) convertTextNode(node);
  }

  scan(document.body);
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') convertTextNode(record.target);
      for (const node of record.addedNodes) scan(node);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  console.info(`[Canonical Timezone Converter] ${SOURCE_ZONE} → ${TARGET_ZONE} enabled`);
})();

/* ==========================================================================
   site.js — loads Markdown posts and the recommended-reads list.

   Content lives in /content:
     content/posts.json          ordered list of post slugs (newest first)
     content/posts/<slug>.md     one file per post, with YAML front matter
     content/reads.json          the recommended-reads list

   Nothing here needs a build step. Note that browsers block fetch() on
   file:// URLs, so preview locally with:  python3 -m http.server
   ========================================================================== */

(function () {
  "use strict";

  var POSTS_INDEX = "content/posts.json";
  var POSTS_DIR = "content/posts/";
  var READS_INDEX = "content/reads.json";

  /* ---------------------------------------------------------------- utils */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function fail(mount, message, detail) {
    mount.innerHTML = "";
    var p = el("p", "error-state");
    p.textContent = message + " ";
    if (detail) {
      var code = el("code", null, detail);
      p.appendChild(code);
    }
    mount.appendChild(p);
  }

  function isFileProtocol() {
    return window.location.protocol === "file:";
  }

  function getJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error(url + " → HTTP " + res.status);
      return res.json();
    });
  }

  function getText(url) {
    return fetch(url, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error(url + " → HTTP " + res.status);
      return res.text();
    });
  }

  /* Accepts either ["slug", ...] or { "posts": ["slug", ...] }. */
  function normalizeIndex(data, key) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data[key])) return data[key];
    return [];
  }

  /* --------------------------------------------------------- front matter */

  /* Minimal YAML subset: `key: value`, plus inline lists `key: [a, b]`.
     Enough for title / date / excerpt. */
  function parseFrontMatter(raw) {
    var text = raw.replace(/^﻿/, "");
    var match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
    if (!match) return { meta: {}, body: text };

    var meta = {};
    match[1].split(/\r?\n/).forEach(function (line) {
      if (!line.trim() || /^\s*#/.test(line)) return;
      var sep = line.indexOf(":");
      if (sep === -1) return;

      var key = line.slice(0, sep).trim();
      var value = line.slice(sep + 1).trim();

      // Strip matching surrounding quotes.
      if (
        value.length > 1 &&
        ((value[0] === '"' && value.slice(-1) === '"') ||
          (value[0] === "'" && value.slice(-1) === "'"))
      ) {
        value = value.slice(1, -1);
      }

      // Inline list: [a, b, c]
      if (value[0] === "[" && value.slice(-1) === "]") {
        meta[key] = value
          .slice(1, -1)
          .split(",")
          .map(function (part) {
            return part.trim().replace(/^["']|["']$/g, "");
          })
          .filter(Boolean);
        return;
      }

      meta[key] = value;
    });

    return { meta: meta, body: match[2] };
  }

  /* Derives a date from the slug (2026-08-29-title) when front matter omits it. */
  function dateFromSlug(slug) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(slug);
    return m ? m[0] : "";
  }

  function formatDate(value) {
    if (!value) return "";
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
    if (!m) return String(value);
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  function firstParagraph(body) {
    var plain = body
      .replace(/^#{1,6}\s.*$/gm, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`>]/g, "")
      .trim();
    var para = plain.split(/\n\s*\n/)[0] || "";
    para = para.replace(/\s+/g, " ").trim();
    return para.length > 260 ? para.slice(0, 257).trimEnd() + "…" : para;
  }

  /* ------------------------------------------------------------- markdown */

  function renderMarkdown(body) {
    if (typeof window.marked === "undefined") {
      var pre = el("pre");
      pre.appendChild(el("code", null, body));
      return pre;
    }
    window.marked.setOptions({ gfm: true, breaks: false });
    var wrapper = el("div");
    wrapper.innerHTML = window.marked.parse(body);

    // External links open in a new tab; wide tables get their own scroller.
    wrapper.querySelectorAll('a[href^="http"]').forEach(function (a) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
    wrapper.querySelectorAll("table").forEach(function (table) {
      var scroller = el("div", "table-scroll");
      table.parentNode.insertBefore(scroller, table);
      scroller.appendChild(table);
    });

    // A "References" heading starts a run of entries that should read as one
    // tight block rather than as spaced body paragraphs.
    wrapper.querySelectorAll("h1, h2, h3").forEach(function (heading) {
      if (!/^references$/i.test(heading.textContent.trim())) return;
      var node = heading.nextElementSibling;
      var first = true;
      while (node && !/^H[1-3]$/.test(node.tagName)) {
        if (!first) node.classList.add("references-item");
        first = false;
        node = node.nextElementSibling;
      }
    });

    // Hand back the blocks themselves, not a wrapper — .prose spaces its
    // direct children, so an extra div would swallow every vertical margin.
    var fragment = document.createDocumentFragment();
    while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
    return fragment;
  }

  /* ---------------------------------------------------------- blog listing */

  function loadPostList(mount) {
    if (isFileProtocol())
      return fail(mount, localPreviewMessage(), "python3 -m http.server");

    getJSON(POSTS_INDEX)
      .then(function (data) {
        var slugs = normalizeIndex(data, "posts");
        if (!slugs.length) {
          mount.innerHTML = "";
          mount.appendChild(
            el("p", "empty-state", "No posts published yet — check back soon."),
          );
          return;
        }
        return Promise.all(
          slugs.map(function (slug) {
            return getText(POSTS_DIR + slug + ".md")
              .then(function (raw) {
                var parsed = parseFrontMatter(raw);
                return { slug: slug, meta: parsed.meta, body: parsed.body };
              })
              .catch(function () {
                return null; // a listed-but-missing file shouldn't blank the page
              });
          }),
        ).then(function (posts) {
          renderPostList(mount, posts.filter(Boolean));
        });
      })
      .catch(function (err) {
        fail(mount, "Couldn't load the post index.", err.message);
      });
  }

  function renderPostList(mount, posts) {
    mount.innerHTML = "";
    if (!posts.length) {
      mount.appendChild(el("p", "empty-state", "No posts published yet."));
      return;
    }

    var list = el("div", "post-list");
    posts.forEach(function (post) {
      var meta = post.meta;
      var href = "post.html?p=" + encodeURIComponent(post.slug);

      var article = el("article", "post-list-item");

      var h2 = el("h2", "post-list-title");
      var link = el("a", null, meta.title || post.slug);
      link.href = href;
      h2.appendChild(link);
      article.appendChild(h2);

      var date = formatDate(meta.date || dateFromSlug(post.slug));
      if (date) article.appendChild(el("div", "post-list-meta", date));

      var excerpt = meta.excerpt || firstParagraph(post.body);
      if (excerpt) article.appendChild(el("p", "post-list-excerpt", excerpt));

      var more = el("a", "read-more", "Read more →");
      more.href = href;
      article.appendChild(more);

      list.appendChild(article);
    });
    mount.appendChild(list);
  }

  /* ------------------------------------------------------------ single post */

  function loadPost(mount, headerMount) {
    var slug = new URLSearchParams(window.location.search).get("p") || "";

    // Guard against path traversal in the query string.
    if (!/^[A-Za-z0-9._-]+$/.test(slug)) {
      fail(mount, "No post specified.");
      return;
    }

    if (isFileProtocol())
      return fail(mount, localPreviewMessage(), "python3 -m http.server");

    getText(POSTS_DIR + slug + ".md")
      .then(function (raw) {
        var parsed = parseFrontMatter(raw);
        var meta = parsed.meta;
        var title = meta.title || slug;

        document.title = title + " — Essa Jan";

        headerMount.innerHTML = "";
        headerMount.appendChild(el("h1", null, title));
        var date = formatDate(meta.date || dateFromSlug(slug));
        if (date) headerMount.appendChild(el("div", "post-meta", date));

        mount.innerHTML = "";
        mount.appendChild(renderMarkdown(parsed.body));
      })
      .catch(function (err) {
        fail(mount, "Couldn't load that post.", err.message);
      });
  }

  /* ------------------------------------------------------- recommended reads */

  function loadReads(mount) {
    if (isFileProtocol())
      return fail(mount, localPreviewMessage(), "python3 -m http.server");

    getJSON(READS_INDEX)
      .then(function (data) {
        var reads = normalizeIndex(data, "reads");
        mount.innerHTML = "";

        if (!reads.length) {
          mount.appendChild(el("p", "empty-state", "Nothing here yet."));
          return;
        }

        var list = el("div", "post-list");
        reads.forEach(function (read) {
          var article = el("article", "post-list-item");

          var h2 = el("h2", "post-list-title");
          if (read.url) {
            var link = el("a", null, read.title || "Untitled");
            link.href = read.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            h2.appendChild(link);
          } else {
            h2.textContent = read.title || "Untitled";
          }
          article.appendChild(h2);

          var bits = [read.author, read.year].filter(Boolean);
          if (bits.length) {
            article.appendChild(el("div", "post-list-meta", bits.join(" · ")));
          }

          list.appendChild(article);
        });
        mount.appendChild(list);
      })
      .catch(function (err) {
        fail(mount, "Couldn't load the reading list.", err.message);
      });
  }

  function localPreviewMessage() {
    return (
      "Content can't be loaded straight from the filesystem. " +
      "Serve the folder and reload — e.g."
    );
  }

  /* ---------------------------------------------------------------- routing */

  document.addEventListener("DOMContentLoaded", function () {
    var postList = document.getElementById("post-list");
    if (postList) loadPostList(postList);

    var postBody = document.getElementById("post-body");
    if (postBody) loadPost(postBody, document.getElementById("post-header"));

    var readsList = document.getElementById("reads-list");
    if (readsList) loadReads(readsList);
  });
})();

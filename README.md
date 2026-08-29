# essacheez.github.io

Personal site — static HTML, no build step. Published with GitHub Pages from
`main`.

## Layout

```
index.html            Home: bio, news, research
blog.html             Post listing (built from content/)
post.html             Renders a single post: post.html?p=<slug>
reads.html            Recommended reads (built from content/reads.json)
404.html
recommended_reads.html Redirect to reads.html (old URL)

assets/
  css/main.css        All styling for every page
  js/site.js          Loads and renders content/
  img/                Photos and paper figures
  logos/

content/
  posts.json          Ordered list of post slugs, newest first
  posts/<slug>.md     One file per post
  posts/example-post.md  Template — not listed, so not published
  reads.json          The reading list
```

## Writing a new post

1. Create `content/posts/<YYYY-MM-DD-slug>.md`:

   ```markdown
   ---
   title: "Why RL Is Eating Post-Training"
   date: 2026-09-14
   excerpt: "One or two sentences for the listing page."
   ---

   Your post, in Markdown.
   ```

   Only `title` is required. `date` falls back to the date in the filename and
   `excerpt` to the first paragraph.

2. Add the slug to the **top** of `content/posts.json` (the list is displayed in
   the order given):

   ```json
   ["2026-09-14-why-rl-is-eating-post-training"]
   ```

3. Commit and push. The post appears at
   `/post.html?p=2026-09-14-why-rl-is-eating-post-training`.

`content/posts/example-post.md` shows every supported Markdown feature. Copy it
to start.

## Adding a recommended read

Append an object to `content/reads.json`. `title` and `url` are required;
`author` and `year` are optional. The page renders the title as a link to `url`.

```json
{
  "title": "The Bitter Lesson",
  "url": "https://example.com/post",
  "author": "Rich Sutton"
}
```

A `note` field is kept on the existing entries but is no longer displayed.

## Previewing locally

Posts are fetched at runtime, and browsers block `fetch()` on `file://` URLs, so
open the site through a server rather than double-clicking the HTML:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Theming

Colors, fonts and page width are CSS custom properties at the top of
`assets/css/main.css` (`--bg`, `--accent`, `--text`, …). Change them there and
every page follows.

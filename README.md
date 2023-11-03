## Minimum Viable Place to Live

This is a browser extension to help identify if a potential home meets your requirements. Users configure their preferences in a tree structure that references OpenStreetMap tags. These preferences include conditional statements as well as arithmetic operators and distance values. When you visit a supported website the page is annotated with a simple ✔️ or ✘ signifying whether the requirements stored in the preference tree are met for a given address.

Supported sites:
- https://www.zillow.com/

Supported browsers:
- Chrome (Version 114.0.5735.198)

## Getting Started

This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

First install all dependencies:

```bash
pnpm install
# or
npm install
```

Then run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the Chrome browser, using manifest v3, go to "Manage extensions" or `chrome://extensions/`, toggle developer mode on, select "Load unpacked", and select the folder `build/chrome-mv3-dev`.

## Production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!

## External Dependencies

There are several external APIs used during operation of this extension.
- [OpenStreetMap taginfo](https://taginfo.openstreetmap.org/) for location tags
- [Maps.co](https://geocode.maps.co) for geocoding addresses to coordinates
- [Overpass](https://www.overpass-api.de) for proximity calculations

## Roadmap

- [ ] Configure GitHub actions to deploy extension to browser stores
- [ ] Test Firefox support
- [ ] Test Edge support
- [ ] Test Safari support
- [ ] Add support for additional sites
- [ ] Add drill-down option to see which requirement failed for a given location
- [ ] Add option for non-binary scores with weighted preferences
- [ ] Add distance and travel mode options (e.g. walking vs driving)
- [ ] User guide / onboarding survey with sample personas
- [ ] Add templates to preference trees (map to personas)
- [ ] Move preference tree from options to popup window
- [ ] Add additional OSM tag inputs not hardcoded to "name"

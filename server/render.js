/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from "react";
// import {renderToString} from 'react-dom/server';
import { Transform } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import {ServerStyleSheet, StyleSheetManager} from "styled-components"
import App from "../src/App";
import { DataProvider } from "../src/data";
import { API_DELAY, ABORT_DELAY } from "./delays";

// In a real setup, you'd read it from webpack build stats.
let assets = {
  "main.js": "/main.js",
  "main.css": "/main.css"
};

module.exports = function render(url, res) {
  // This is how you would wire it up previously:
  //
  // res.send(
  //   '<!DOCTYPE html>' +
  //   renderToString(
  //     <DataProvider data={data}>
  //       <App assets={assets} />
  //     </DataProvider>,
  //   )
  // );

  // The new wiring is a bit more involved.
  res.socket.on("error", (error) => {
    console.error("Fatal", error);
  });
  let didError = false;
  const data = createServerData();
  const sheet = new ServerStyleSheet();	

  const readerWriter = new Transform({
    objectMode: true,
    transform(
      chunk,
      /* encoding */
      _,
      callback
    ) {
      // Get the chunk and retrieve the sheet's CSS as an HTML chunk,
      // then reset its rules so we get only new ones for the next chunk
      const renderedHtml = chunk.toString();
      const styledCSS = sheet._emitSheetCSS();
      const CLOSING_TAG_R = /<\/[a-z]*>/i;

      sheet.instance.clearTag(); 

      // prepend style html to chunk, unless the start of the chunk is a 
      // closing tag in which case append right after that
      if (/<\/head>/.test(renderedHtml)) { 
        const replacedHtml = renderedHtml.replace('</head>', `${styledCSS}</head>`); 
        this.push(replacedHtml); 
      } else if (CLOSING_TAG_R.test(renderedHtml)) { 
        const execResult = CLOSING_TAG_R.exec(renderedHtml); 
        const endOfClosingTag = execResult.index + execResult.flat().length - 1; 
        const before = renderedHtml.slice(0, endOfClosingTag); 
        const after = renderedHtml.slice(endOfClosingTag);
        this.push(before + styledCSS + after); 
      } else { 
        this.push(styledCSS + renderedHtml); 
      }
      callback();
    },
  });
  
  const stream = renderToPipeableStream(
    <StyleSheetManager sheet={sheet.instance}>
      <DataProvider data={data}>
        <App assets={assets} />
      </DataProvider>
    </StyleSheetManager>,
    {
      bootstrapScripts: [assets["main.js"]],
      onShellReady() {
        // If something errored before we started streaming, we set the error code appropriately.
        res.statusCode = didError ? 500 : 200;
        res.setHeader("Content-type", "text/html");
        stream.pipe(readerWriter);
      },
      onError(x) {
        didError = true;
        console.error(x);
      }
    }
  );
  // Abandon and switch to client rendering if enough time passes.
  // Try lowering this to see the client recover.
  setTimeout(() => stream.abort(), ABORT_DELAY);

  readerWriter.pipe(res);
};

// Simulate a delay caused by data fetching.
// We fake this because the streaming HTML renderer
// is not yet integrated with real data fetching strategies.
function createServerData() {
  let done = false;
  let promise = null;
  return {
    read() {
      if (done) {
        return;
      }
      if (promise) {
        throw promise;
      }
      promise = new Promise((resolve) => {
        setTimeout(() => {
          done = true;
          promise = null;
          resolve();
        }, API_DELAY);
      });
      throw promise;
    }
  };
}

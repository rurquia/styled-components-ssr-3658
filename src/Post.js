import styled from "styled-components";

const FirstP = styled.p`
background-color: red;
`;
const SecondP = styled.p`
background-color: green;
`;
const ThirdP = styled.p`
background-color: yellow;
`;
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default function Post() {
  return (
    <>
      <h1>Hello world</h1>
      <FirstP>
        This demo is <b>artificially slowed down</b>. Open{' '}
        <code>server/delays.js</code> to adjust how much different things are
        slowed down.
      </FirstP>
      <SecondP>
        Notice how HTML for comments "streams in" before the JS (or React) has
        loaded on the page.
      </SecondP>
      <ThirdP>
        Also notice that the JS for comments and sidebar has been code-split,
        but HTML for it is still included in the server output.
      </ThirdP>
    </>
  );
}

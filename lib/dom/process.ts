import { generateXPathsForElement as generateXPaths } from "./xpathUtils";
import {
  canElementScroll,
  getNodeFromXpath,
  waitForDomSettle,
  waitForElementScrollEnd,
} from "./utils";

/**
 * Finds and returns a list of scrollable elements on the page,
 * ordered from the element with the largest scrollHeight to the smallest.
 *
 * @param topN Optional maximum number of scrollable elements to return.
 *             If not provided, all found scrollable elements are returned.
 * @returns An array of HTMLElements sorted by descending scrollHeight.
 */
export function getScrollableElements(topN?: number): HTMLElement[] {
  // Get the root <html> element
  const docEl = document.documentElement;

  // 1) Initialize an array to hold all scrollable elements.
  //    Always include the root <html> element as a fallback.
  const scrollableElements: HTMLElement[] = [docEl];

  // 2) Scan all elements to find potential scrollable containers.
  //    A candidate must have a scrollable overflow style and extra scrollable content.
  const allElements = document.querySelectorAll<HTMLElement>("*");
  for (const elem of allElements) {
    const style = window.getComputedStyle(elem);
    const overflowY = style.overflowY;

    const isPotentiallyScrollable =
      overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";

    if (isPotentiallyScrollable) {
      const candidateScrollDiff = elem.scrollHeight - elem.clientHeight;
      // Only consider this element if it actually has extra scrollable content
      // and it can truly scroll.
      if (candidateScrollDiff > 0 && canElementScroll(elem)) {
        scrollableElements.push(elem);
      }
    }
  }

  // 3) Sort the scrollable elements from largest scrollHeight to smallest.
  scrollableElements.sort((a, b) => b.scrollHeight - a.scrollHeight);

  // 4) If a topN limit is specified, return only the first topN elements.
  if (topN !== undefined) {
    return scrollableElements.slice(0, topN);
  }

  // Return all found scrollable elements if no limit is provided.
  return scrollableElements;
}

/**
 * Calls getScrollableElements, then for each element calls generateXPaths,
 * and returns the first XPath for each.
 *
 * @param topN (optional) integer limit on how many scrollable elements to process
 * @returns string[] list of XPaths (1 for each scrollable element)
 */
export async function getScrollableElementXpaths(
  topN?: number,
): Promise<string[]> {
  const scrollableElems = getScrollableElements(topN);
  const xpaths = [];
  for (const elem of scrollableElems) {
    const allXPaths = await generateXPaths(elem);
    const firstXPath = allXPaths?.[0] || "";
    xpaths.push(firstXPath);
  }
  return xpaths;
}

export function getNearestScrollableParent(el: HTMLElement): HTMLElement {
  // 1) Get *all* scrollable elements on the page
  //    (You could pass a large topN or omit it for “all”)
  const allScrollables = getScrollableElements();

  // 2) Climb up the DOM tree
  let current: HTMLElement | null = el;
  while (current) {
    // If `current` is in the scrollable list, we have our nearest scrollable parent
    if (allScrollables.includes(current)) {
      return current;
    }
    current = current.parentElement;
  }

  // 3) If we exhaust the ancestors, default to root
  return document.documentElement;
}

window.waitForDomSettle = waitForDomSettle;
window.getScrollableElementXpaths = getScrollableElementXpaths;
window.getNodeFromXpath = getNodeFromXpath;
window.waitForElementScrollEnd = waitForElementScrollEnd;

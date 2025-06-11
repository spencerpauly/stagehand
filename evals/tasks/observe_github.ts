import { EvalFunction } from "@/types/evals";

export const observe_github: EvalFunction = async ({
  debugUrl,
  sessionUrl,
  stagehand,
  logger,
}) => {
  await stagehand.page.goto("https://github.com/numpy/numpy/tree/main/numpy");

  const observations = await stagehand.page.observe({
    instruction: "find the scrollable element that holds the repos file tree.",
  });

  if (observations.length === 0) {
    await stagehand.close();
    return {
      _success: false,
      observations,
      debugUrl,
      sessionUrl,
      logs: logger.getLogs(),
    };
  }

  const possibleLocators = [
    `#repo-content-pjax-container > react-app > div > div > div.Box-sc-g0xbh4-0.prc-PageLayout-PageLayoutRoot-1zlEO > div > div > div.Box-sc-g0xbh4-0.gISSDQ > div`,
    `#repo-content-pjax-container > react-app > div > div > div.Box-sc-g0xbh4-0.prc-PageLayout-PageLayoutRoot-1zlEO > div > div > div.Box-sc-g0xbh4-0.gISSDQ`,
    `#repos-file-tree`,
    `#repo-content-pjax-container > react-app > div > div > div.Box-sc-g0xbh4-0.prc-PageLayout-PageLayoutRoot-1zlEO > div > div > div.Box-sc-g0xbh4-0.gISSDQ > div > div.prc-PageLayout-Pane-Vl5LI > div`,
    `#repo-content-pjax-container > react-app > div > div > div.Box-sc-g0xbh4-0.prc-PageLayout-PageLayoutRoot-1zlEO > div > div > div.Box-sc-g0xbh4-0.gISSDQ > div > div.prc-PageLayout-Pane-Vl5LI`,
    `#repos-file-tree > div.Box-sc-g0xbh4-0.ReposFileTreePane-module__Box_5--tQNH_`,
    `#repos-file-tree > div.Box-sc-g0xbh4-0.ReposFileTreePane-module__Box_5--tQNH_ > div`,
    `#repos-file-tree > div.Box-sc-g0xbh4-0.ReposFileTreePane-module__Box_5--tQNH_ > div > div > div`,
    `#repos-file-tree > div.Box-sc-g0xbh4-0.ReposFileTreePane-module__Box_5--tQNH_ > div > div > div > nav`,
    `#repos-file-tree > div.Box-sc-g0xbh4-0.ReposFileTreePane-module__Box_5--tQNH_ > div > div > div > nav > ul`,
  ];

  const possibleHandles = [];
  for (const locatorStr of possibleLocators) {
    const locator = stagehand.page.locator(locatorStr);
    const handle = await locator.elementHandle();
    if (handle) {
      possibleHandles.push({ locatorStr, handle });
    }
  }

  let foundMatch = false;
  let matchedLocator: string | null = null;

  for (const observation of observations) {
    try {
      const observationLocator = stagehand.page
        .locator(observation.selector)
        .first();
      const observationHandle = await observationLocator.elementHandle();
      if (!observationHandle) {
        continue;
      }

      for (const { locatorStr, handle: candidateHandle } of possibleHandles) {
        const isSameNode = await observationHandle.evaluate(
          (node, otherNode) => node === otherNode,
          candidateHandle,
        );
        if (isSameNode) {
          foundMatch = true;
          matchedLocator = locatorStr;
          break;
        }
      }

      if (foundMatch) {
        break;
      }
    } catch (error) {
      console.warn(
        `Failed to check observation with selector ${observation.selector}:`,
        error.message,
      );
      continue;
    }
  }

  await stagehand.close();

  return {
    _success: foundMatch,
    matchedLocator,
    observations,
    debugUrl,
    sessionUrl,
    logs: logger.getLogs(),
  };
};

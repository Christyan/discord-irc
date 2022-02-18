import ircFormatting from 'irc-formatting';
import SimpleMarkdown from 'simple-markdown';
import colors from 'irc-colors';

function mdNodeToIRC(node) {
  let { content } = node;
  if (Array.isArray(content)) content = content.map(mdNodeToIRC).join('');
  switch (node.type) {
    case 'em':
      return colors.italic(content);
    case 'strong':
      return colors.bold(content);
    case 'u':
      return colors.underline(content);
    default:
      return content;
  }
}

export function formatFromDiscordToIRC(text) {
  const markdownAST = SimpleMarkdown.defaultInlineParse(text);
  return markdownAST.map(mdNodeToIRC).join('');
}

export function formatFromIRCToDiscord(text, asAnsi) {

  const ircColorsToAnsii = {
    0 : 37, // white -> default
    1:  30, // black -> black
    2: 34, // blue -> blue
    3: 32, // green - green
    4: 31, // light red -> red
    5: 31, // brown -> red
    6: 35, // purple -> magenta
    7: 33, // orange -> yellow
    8: 33, // yellow -> yellow
    9: 32, // light green -> green
    10: 36, // cyan
    11: 36, // light cyan
    12: 34, // light blue
    13: 35, // pink
    14: 30, // grey
    15: 30, // light grey
  }

  const blocks = ircFormatting.parse(text).map(block => ({
    // Consider reverse as italic, some IRC clients use that
    ...block,
    italic: block.italic || block.reverse,
    color: block.color
  }));
  let mdText = '';

  for (let i = 0; i <= blocks.length; i += 1) {
    // Default to unstyled blocks when index out of range
    const block = blocks[i] || {};
    const prevBlock = blocks[i - 1] || {};

    if (!asAnsi)
    {
      // Add start markers when style turns from false to true
      if (!prevBlock.italic && block.italic) mdText += '*';
      if (!prevBlock.bold && block.bold) mdText += '**';
      if (!prevBlock.underline && block.underline) mdText += '__';

      // Add end markers when style turns from true to false
      // (and apply in reverse order to maintain nesting)
      if (prevBlock.underline && !block.underline) mdText += '__';
      if (prevBlock.bold && !block.bold) mdText += '**';
      if (prevBlock.italic && !block.italic) mdText += '*';
    }
    else
    {
      if (block.bold || block.underline || (block.color && block.color != -1))
      {
          let strformat = "0;";
          if (block.bold)
              stformat = "1;";
          else if (block.underline)
              stformat = "4;";

          let colorFormat = "m";
          if (block.color != null && block.color >= 0)
          {
            colorFormat = ircColorsToAnsii[block.color] + "m";
          }
          

          mdText += "\u001b[" + strformat + colorFormat;
      }
      else if (prevBlock.bold || prevBlock.underline || prevBlock.color)
      {
        mdText += "\u001b[0m";
      }
    }

    mdText += block.text || '';
  }

  return mdText;
}

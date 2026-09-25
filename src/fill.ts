import type {Block} from "./schema";

/**
 * Whether a block stretches to share the height when its column fills: terminals, code,
 * and cards that carry both a title and a body. A card with only a title or only a body keeps its
 * natural height; stretched, it turns into a tall, mostly empty box.
 */
export const stretches = (block: Block): boolean => {
  switch (block.type) {
    case "terminal":
    case "code":
      return true;
    case "card":
      return block.title !== undefined && block.body !== undefined;
    default:
      return false;
  }
};

/** Whether a column fills down to L.fillBottom: it holds two or more stretching panels. */
export const fills = (blocks: Block[]): boolean => blocks.filter(stretches).length >= 2;

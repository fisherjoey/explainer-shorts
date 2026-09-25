import type {ReactNode} from "react";
import type {Block} from "../../schema";
import {Arrow} from "./Arrow";
import {Browser} from "./Browser";
import {Card} from "./Card";
import {Checklist} from "./Checklist";
import {Chips} from "./Chips";
import {Code} from "./Code";
import {Compare} from "./Compare";
import {Kv} from "./Kv";
import {Meter} from "./Meter";
import {Note} from "./Note";
import {Row} from "./Row";
import {Segments} from "./Segments";
import type {Ctx} from "./shared";
import {Stat} from "./Stat";
import {Steps} from "./Steps";
import {Terminal} from "./Terminal";
import {Tiles} from "./Tiles";

/** Renders one visual block at `ctx.width`; `row` recurses with the width split evenly. */
export const renderBlock = (block: Block, ctx: Ctx): ReactNode => {
  switch (block.type) {
    case "terminal":
      return <Terminal block={block} ctx={ctx} />;
    case "code":
      return <Code block={block} ctx={ctx} />;
    case "browser":
      return <Browser block={block} ctx={ctx} />;
    case "card":
      return <Card block={block} ctx={ctx} />;
    case "chips":
      return <Chips block={block} ctx={ctx} />;
    case "segments":
      return <Segments block={block} ctx={ctx} />;
    case "arrow":
      return <Arrow block={block} ctx={ctx} />;
    case "steps":
      return <Steps block={block} ctx={ctx} />;
    case "checklist":
      return <Checklist block={block} ctx={ctx} />;
    case "compare":
      return <Compare block={block} ctx={ctx} />;
    case "stat":
      return <Stat block={block} ctx={ctx} />;
    case "meter":
      return <Meter block={block} ctx={ctx} />;
    case "kv":
      return <Kv block={block} ctx={ctx} />;
    case "tiles":
      return <Tiles block={block} ctx={ctx} />;
    case "note":
      return <Note block={block} ctx={ctx} />;
    case "row":
      return <Row block={block} ctx={ctx} render={renderBlock} />;
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
};

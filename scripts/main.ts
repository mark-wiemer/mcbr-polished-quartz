import { world, system, Player, InventoryComponentContainer, EntityInventoryComponent } from "@minecraft/server";
import { readInventory, findSwaps, doSafely } from "./utils";

let tickIndex = 0;
const swaps: any[] = [];
let inventory: InventoryComponentContainer | null = null;
/** index of inventory to announce. Resets to 0 on item use. */
let isSorting: boolean = false;

const say = (msg: string) => world.getDimension("overworld").runCommandAsync(`say ${msg}`);

function mainTick() {
  try {
    tickIndex++;
    if (isSorting) {
      if (swaps?.length > 0) doNextSwap();
      else {
        say("Sort complete");
        isSorting = false;
      }
    }
  } catch (e) {
    console.warn("Script error: " + e);
  }
  system.run(mainTick);
}

/** Do the next swap to sort the inventory */
const doNextSwap = () => {
  const swap = swaps.shift();
  const swapMsg = swap ? `from ${swap.from} to ${swap.to}` : "n/a";
  say(swapMsg);
  if (!swap || !inventory) return;
  inventory.transferItem(swap.from, swap.to, inventory);
};

system.run(mainTick);

world.events.beforeItemUse.subscribe(
  doSafely((event) => {
    const player = event.source as Player;
    if (!player.name) return;
    inventory = (player.getComponent("inventory") as EntityInventoryComponent).container;
    isSorting = true;
    const newSwaps = findSwaps(readInventory(inventory));
    swaps.push(...newSwaps);
  })
);

/**
 * This helper method will create an array of slots, where every slot contains one of
 * the provided `items`. Every slot has a unique `id` and when the items change, the
 * slots are recycled to avoid re-render. Every item that persists will it's own
 * slot id.
 *
 * This is useful so virtual scroll. The `id` of the slot can be used to as
 * `:key="slot.id"` value in the template. Because the id will always match the item
 * id, it will never update or re-render the component. New items will get a
 * recycled slot id so that they don't have to be re-rendered.
 *
 * It is a requirement that every item has an `id` property to make sure the id of
 * the slot is properly recycled.
 *
 * Optionally a `getPosition` can be provided to set the `position` property in each
 * slot. This is typically used by virtual scrolling change the absolute position of
 * the dom element. This could be needed because the elements before are not rendered
 * and are not pushing it into the right position.
 *
 * Example:
 *
 * const slots = recycleSlots(
 *  [],
 *  [
 *    { id: 1, name: "Item 1" },
 *    { id: 2, name: "Item 2" }
 *  ]
 * ) == [
 *   { id: 0, position: {}, item: { id: 1, name: "Item 1" } },
 *   { id: 1, position: {}, item: { id: 2, name: "Item 2" } }
 * ]
 *
 * recycleSlots(
 *  slots,
 *  [
 *    { id: 2, name: "Item 2" },
 *    { id: 3, name: "Item 3" }
 *  ]
 * ) == [
 *   { id: 0, position: {}, item: { id: 3, name: "Item 3" } },
 *   { id: 1, position: {}, item: { id: 2, name: "Item 2" } }
 * ]
 */
export const recycleSlots = (slots, items, getPosition, min = items.length) => {
  // If there are more items than the minimum that must be rendered, we want to
  // increase the minimum to ensure all items are visible.
  if (min < items.length) {
    min = items.length
  }

  // Create the missing slots.
  for (let i = slots.length; i < min; i++) {
    slots.push({
      id: i,
      position: {},
      item: undefined,
    })
  }

  // Remove slots that aren't needed anymore.
  if (slots.length > min) {
    slots.splice(items.length, min)
  }

  const emptySlots = []
  const itemSlotIndexMap = {}

  // Loop over the slots and clear the items that must not be rendered anymore.
  slots.forEach((slot, index) => {
    if (slot.item === undefined || slot.item === null) {
      emptySlots.push(index)
      return
    }

    const itemIndex = items.findIndex(
      (item) => item !== null && item.id === slot.item.id
    )

    if (itemIndex < 0) {
      // Slot item is not visible anymore.
      slot.item = undefined
      slot.position = {}
      emptySlots.push(index)
    } else {
      // Item is found in slot array.
      itemSlotIndexMap[items[itemIndex].id] = index
    }
  })

  // Loop over the items and assign them to a slot if they don't yet exist.
  items.forEach((item, position) => {
    let index = itemSlotIndexMap[item?.id]

    // If item isn't in a slot yet we use the first emtpy slot index.
    if (index === undefined) {
      index = emptySlots.shift()
    }

    // Only update the item and position if it has changed in the slot to avoid
    // re-renders.
    if (slots[index].item !== item) {
      slots[index].item = item
    }

    const slotPosition = getPosition(item, position)
    if (
      JSON.stringify(slotPosition) !== JSON.stringify(slots[index].position)
    ) {
      slots[index].position = slotPosition
    }
  })

  // The remaining empty slots must be cleared because they could contain old items.
  emptySlots.forEach((slotIndex) => {
    slots[slotIndex].item = undefined
    slots[slotIndex].position = {}
  })
}

/**
 * This function will order the slots based on the item position in items array. The
 * slots will be moved without recreating the array to prevent re-rendering.
 */
export const orderSlots = (slots, items) => {
  let i = 0
  while (i < items.length) {
    const item = items[i]

    // Items can be null until they're fetched from server.
    if (item === null) {
      i++
      continue
    }

    const existingIndex = slots.findIndex(
      (slot) =>
        slot.item !== null &&
        slot.item !== undefined &&
        slot.item.id === item.id
    )

    if (existingIndex > -1 && existingIndex !== i) {
      // If the item already exists in the slots array, but the position match yet,
      // we need to move it.
      if (existingIndex < i) {
        // In this case, the existing index is lower than the new index, so in order
        // avoid conflicts with already moved items we just swap them.
        slots.splice(i, 0, slots.splice(existingIndex, 1)[0])
        slots.splice(existingIndex, 0, slots.splice(i - 1, 1)[0])
        i++
      } else if (existingIndex > i) {
        // If the existing index is higher than the expected index, we need to move
        // it one by one to avoid conflicts with already moved items.
        slots.splice(existingIndex - 1, 0, slots.splice(existingIndex, 1)[0])
      }
    } else {
      i++
    }
  }
}

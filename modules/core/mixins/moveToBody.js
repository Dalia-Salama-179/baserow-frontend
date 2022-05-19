export default {
  data() {
    return {
      moveToBody: {
        children: [],
        hasMoved: false,
        movedEventHandlers: [],
      },
    }
  },
  /**
   * Because we want the to be able to stack nested elements that are moved to
   * the body, they have to be placed at the correct position. If it has no
   * parent it must be moved to the top of the body, but if there is a parent it
   * must be directly under that so it will always display on over of that
   * component.
   */
  mounted() {
    let parent = this.$parent
    let first = null

    // Loop over the parent components to register himself as child in order
    // to prevent closing when clicking in a child. We also check which parent
    // is first so can correctly move the element.
    while (parent !== undefined) {
      if (Object.prototype.hasOwnProperty.call(parent, 'moveToBody')) {
        parent.registerMoveToBodyChild(this)
        if (first === null) {
          first = parent
        }
      }
      parent = parent.$parent
    }

    if (first) {
      // If there is a parent where we can register we want to position the
      // element directly after that one so it will always be positioned over
      // the parent when opened.
      const handler = () => {
        // Some times we have to wait for elements to render like with v-if.
        this.$nextTick(() => {
          first.$el.parentNode.insertBefore(this.$el, first.$el.nextSibling)
          this.fireMovedToBodyHandlers()
        })
      }

      // If the element has already moved to the body we can directly move it to
      // the correct position. If not we have to wait until it will move.
      if (first.moveToBody.hasMoved) {
        handler()
      } else {
        first.addMovedToBodyHandler(handler)
      }
    } else {
      // Because there is no parent we can directly move the component to the
      // top of the body so it will be positioned over any other element.
      const body = document.body
      body.insertBefore(this.$el, body.firstChild)
      this.fireMovedToBodyHandlers()
    }

    this.moveToBody.hasMoved = true
  },
  /**
   * Make sure the context menu is not open and all the events on the body are
   * removed and that the element is removed from the body.
   */
  destroyed() {
    this.hide(false)

    if (this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el)
    }
  },
  methods: {
    /**
     * Event handlers when the element has moved to the body can be registered
     * here.
     */
    addMovedToBodyHandler(handler) {
      this.moveToBody.movedEventHandlers.push(handler)
    },
    /**
     *
     */
    fireMovedToBodyHandlers() {
      this.moveToBody.movedEventHandlers.forEach((handler) => handler())
    },
    /**
     *
     */
    registerMoveToBodyChild(child) {
      this.moveToBody.children.push(child)
    },
  },
}

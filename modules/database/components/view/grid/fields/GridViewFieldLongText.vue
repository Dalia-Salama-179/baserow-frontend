<template>
  <div
    ref="cell"
    class="grid-view__cell grid-field-long-text__cell active"
    :class="{ editing: editing }"
    @contextmenu="stopContextIfEditing($event)"
  >
    <div v-show="!editing" class="grid-field-long-text">{{ value }}</div>
    <textarea
      v-if="editing"
      ref="input"
      v-model="copy"
      v-prevent-parent-scroll
      type="text"
      class="grid-field-long-text__textarea"
    />
  </div>
</template>

<script>
import gridField from '@baserow/modules/database/mixins/gridField'
import gridFieldInput from '@baserow/modules/database/mixins/gridFieldInput'

export default {
  mixins: [gridField, gridFieldInput],
  methods: {
    dumbComaSplit(inputString) {
        var strArray = [];
        var tmpStr = "";
        for (var i = 0; i < inputString.length; i++) {
              if (inputString.charAt(i) == '\n') {
                  strArray.push(tmpStr);
                  tmpStr = "";
                  continue;
              }
              tmpStr += inputString.charAt(i);
          }
          strArray.push(tmpStr);
          return strArray;
    },
    csvParse(inputString) {
        var outputArray = [];
        var inputArray = this.dumbComaSplit(inputString);
        for (var i =0; i < inputArray.length; i++) {
          if (!Number.isNaN(+inputArray[i])) {
            outputArray.push(+inputArray[i]);
        } else {
          outputArray.push(inputArray[i].replace(/['"]+/g,'').trim());
        }
        }
        return outputArray;
    },
    afterEdit(event) {
      // conso/le.log('event',event);
      //  document.addEventListener("paste", e => {
      //   let text = e.clipboardData.getData("text");
      //   let array = this.csvParse(text)
      //   console.log(array);
      // });
      // If the enter key is pressed we do not want to add a new line to the textarea.
      if (event.type === 'keydown' && event.keyCode === 13) {
        event.preventDefault()
      }
      this.$nextTick(() => {
        this.$refs.input.focus();
        this.$refs.input.selectionStart = this.$refs.input.selectionEnd = 100000;
      })
    },
    canSaveByPressingEnter() {
      return false
    },
  },
}
</script>

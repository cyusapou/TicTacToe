<template>
  <div class="maincontainer">
    <div class="info">
      <div class="red">
        
        <p class="scorex">{{ countx }}</p>
      </div>
      <div class="msg">{{ msg }}</div>
      <div class="blue">
        <p class="scoreo">{{ counto }}</p>
      </div>
    </div>
    <div class="center">
  <div class="container">
    <div 
    v-for="(box, index) in square" 
    :key="index"
    class="box"
    @click="play(index)"
    v-html="box.cont"
    :style="{pointerEvents: clickable}"
    
    ></div>
  </div>
  </div>
  </div>

</template>
<script setup>
import { ref } from 'vue';

let square = ref([
  {cont : ""} , {cont : ""} , {cont : ""} ,
  {cont : ""} , {cont : ""} , {cont : ""} ,
  {cont : ""} , {cont : ""} , {cont : ""} 
]);
let clickable=""
let turn = 0 
let x = `<p class="xcomp">X</p>`
let o = `<p class="ocomp">O</p>`
let msg = ref("");
let countx = ref(0)
let counto = ref(0)

function play(index) {

 
 

  if (square.value[index].cont !== "") return

  turn++

  if (turn % 2 === 0) {
    square.value[index].cont = x
  } else {
    square.value[index].cont = o
  }

  // ✅ NOW calculate win conditions (after update)

  let ifx1 = (square.value[0].cont === x && square.value[1].cont === x && square.value[2].cont === x)
  let ifx2 = (square.value[3].cont === x && square.value[4].cont === x && square.value[5].cont === x)
  let ifx3 = (square.value[6].cont === x && square.value[7].cont === x && square.value[8].cont === x)
  let ifx4 = (square.value[0].cont === x && square.value[3].cont === x && square.value[6].cont === x)
  let ifx5 = (square.value[1].cont === x && square.value[4].cont === x && square.value[7].cont === x)
  let ifx6 = (square.value[2].cont === x && square.value[5].cont === x && square.value[8].cont === x)
  let ifx7 = (square.value[0].cont === x && square.value[4].cont === x && square.value[8].cont === x)
  let ifx8 = (square.value[2].cont === x && square.value[4].cont === x && square.value[6].cont === x)

  let ifo1 = (square.value[0].cont === o && square.value[1].cont === o && square.value[2].cont === o)
  let ifo2 = (square.value[3].cont === o && square.value[4].cont === o && square.value[5].cont === o)
  let ifo3 = (square.value[6].cont === o && square.value[7].cont === o && square.value[8].cont === o)
  let ifo4 = (square.value[0].cont === o && square.value[3].cont === o && square.value[6].cont === o)
  let ifo5 = (square.value[1].cont === o && square.value[4].cont === o && square.value[7].cont === o)
  let ifo6 = (square.value[2].cont === o && square.value[5].cont === o && square.value[8].cont === o)
  let ifo7 = (square.value[0].cont === o && square.value[4].cont === o && square.value[8].cont === o)
  let ifo8 = (square.value[2].cont === o && square.value[4].cont === o && square.value[6].cont === o)
  if (turn) { 

  if (ifx1 || ifx2 || ifx3 || ifx4 || ifx5 || ifx6 || ifx7 || ifx8) {
    countx.value++
    console.log("x won")
    setTimeout(() => {
      msg.value = ""

    },3000)
    msg.value= "Red Won"
    let x = `<p class="xcomp high">X</p>`
    clickable = "none"
    setTimeout(()=> {
      square.value[0].cont =""
    square.value[1].cont =""
    square.value[2].cont =""
    square.value[3].cont =""
    square.value[4].cont =""
    square.value[5].cont =""
    square.value[6].cont =""
    square.value[7].cont =""
    square.value[8].cont =""
    clickable=""
    },3000)
    
  }

  if (ifo1 || ifo2 || ifo3 || ifo4 || ifo5 || ifo6 || ifo7 || ifo8) {
    counto.value++
    console.log("o won")
   setTimeout(() => {
      msg.value = ""

    },3000)
    msg.value= "Blue Won"
    clickable = "none"
    setTimeout(()=> {
      square.value[0].cont =""
    square.value[1].cont =""
    square.value[2].cont =""
    square.value[3].cont =""
    square.value[4].cont =""
    square.value[5].cont =""
    square.value[6].cont =""
    square.value[7].cont =""
    square.value[8].cont =""
    clickable=""
    },3000)
  }
} else {
  setTimeout(()=> {
      square.value[0].cont =""
    square.value[1].cont =""
    square.value[2].cont =""
    square.value[3].cont =""
    square.value[4].cont =""
    square.value[5].cont =""
    square.value[6].cont =""
    square.value[7].cont =""
    square.value[8].cont =""
    clickable=""
    },3000)

}
}
</script>

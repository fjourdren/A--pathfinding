let Position2D = class Position2D {
	constructor(x, y) {
		this.x = x
		this.y = y
	}
}


let Case = class Case {
	constructor(position, size) {
		this.position = position
		this.size = size

		this.color = color(140, 140, 140)
	}

	update() {
		
	}

	draw() {
		fill(this.color)
		noStroke()
		renderRect(this.position, this.size)
	}
}


let CaseAStar = class CaseAStar {
	constructor(meCase) {
		this.case = meCase
	}

	setParent(parent) {
		this.parent = parent
	}

	calculateEuristic(destination) {
		this.euristic = distanceBeetweenTwoCaseAStar(this, destination)
		return this.euristic
	}

	// nodeParentLocal + nodeParentDistance
	calculateLocal() {
		if(this.parent) {
			let parentLocal = this.parent.calculateLocal()
			this.local = parentLocal + distanceBeetweenTwoCaseAStar(this, this.parent)
		} else {
			this.local = 0
		}

		return this.local
	}

	// euristic + local
	calculateGlobal() {
		this.calculateLocal()
		this.global = this.euristic + this.local
		return this.global
	}
}


//nees that to not kill P5.js ES6 no support
function renderRect(position, size) {
	rect(position.x * size + 1, position.y * size + 1, size - 1, size - 1)
}



var caseSize = 25
var mapSize = 20
var mapArray

var caseStart, caseStop

var open = []
var close = []

var finish = false

var colorSave

var finalCaseAStar


function setup() {
	colorSave = {
		GREEN: color(0, 255, 0),
		BLUE: color(0, 0, 255),
		RED: color(255, 0, 0),
		YELLOW: color(232, 244, 0),
		ORANGE: color(255,165,0)
	}

	createCanvas(501, 501)
	frameRate(30)
	stroke(255) // Set line drawing color to white

	// generate map
	mapArray = generateMap(mapSize)

	caseStart = mapArray[randomNumber(0, mapSize - 1)][randomNumber(0, mapSize - 1)]
	caseStart.color = colorSave.GREEN

	do {
		caseStop = mapArray[randomNumber(0, mapSize - 1)][randomNumber(0, mapSize - 1)]
		caseStop.color = colorSave.BLUE
	} while(caseStop === caseStart)
	

	let CaseAStarStart = new CaseAStar(caseStart)
	let CaseAStarStop = new CaseAStar(caseStop)
	
	do {
		let caseInTestAStar

		if(open.length == 0) {
			caseInTestAStar = CaseAStarStart
		} else {
			caseInTestAStar = getLowestGlobalFromOpen()
		}

		let casesInTestArray = getCaseArround(caseInTestAStar)
		for(let i = 0; i < casesInTestArray.length; i++) {
			let caseInGeneration = casesInTestArray[i]
			let caseAStarInGeneration = new CaseAStar(caseInGeneration)

			caseAStarInGeneration.setParent(caseInTestAStar)
			caseAStarInGeneration.calculateEuristic(CaseAStarStop)

			caseAStarInGeneration.calculateLocal()
			caseAStarInGeneration.calculateGlobal()

			if(elementExistInArray(close, caseInGeneration) == false) {
				open.push(caseAStarInGeneration)
			} else {
				for(let i = 0; i < open.length; i++) {
					if(open[i].global > caseAStarInGeneration.global) {
						if(open[i].position = caseInGeneration.position) {
							open[i] = caseAStarInGeneration
						}
					}
				}
			}

			if(caseAStarInGeneration.case == CaseAStarStop.case) {
				finish = true
				finalCaseAStar = caseAStarInGeneration
				console.log("Solution found !")
			}
		}

		open = removeElementFromArray(open, caseInTestAStar)
		if(elementExistInArray(close, caseInTestAStar) == false) {
			close.push(caseInTestAStar)
		}

		if(open.length <= 0) {
			finish = true
			console.log("Solution not found")
		}

		console.log("Open : " + open.length + " | close : " + close.length)
	} while(finish == false)
}


function draw() { 
	background(0)   // Set the background to black
	

	// modification des couleurs
	for(let i = 0; i < open.length; i++) {
		let caseToDraw = open[i].case
		if(caseToDraw != caseStart && caseToDraw != caseStop)
			open[i].case.color = colorSave.ORANGE
	}


	for(let i = 0; i < close.length; i++) {
		let caseToDraw = close[i].case
		if(caseToDraw != caseStart && caseToDraw != caseStop)
			close[i].case.color = colorSave.RED
	}


	let lastParentRender = finalCaseAStar
	while(lastParentRender.parent != undefined) {
		if(lastParentRender.case != caseStop) {
			lastParentRender.case.color = colorSave.YELLOW
		}

		lastParentRender = lastParentRender.parent
	}



	for (let x = 0; x < mapArray.length; x++) {
		for (let y = 0; y < mapArray[0].length; y++) {
			let caseIntance = mapArray[x][y]
			caseIntance.update()
			caseIntance.draw()
		}
	}
}


function generateMap(size) {
	let map = []
  
	for (let x = 0; x < size; x++) {
		map[x] = []
		for (let y = 0; y < size; y++) {
			let position = new Position2D(x, y)
			map[x][y] = new Case(position, caseSize)
		}
	}

	return map
}


function randomNumber(min, max) {
	return Math.floor(Math.random() * max) + min
}


function distanceBeetweenTwoCaseAStar(case1, case2) {
	let diffx = Math.abs(case1.case.position.x - case2.case.position.x)
	let diffy = Math.abs(case1.case.position.y - case2.case.position.y)

	if(case1.case.position == case2.case.position)
		return 0

	if(case1.case.position.x == case2.case.position.x)
		return diffy

	if(case1.case.position.y == case2.case.position.y)
		return diffx

	return Math.floor(Math.sqrt(Math.pow(diffx, 2) + Math.pow(diffy, 2)))
}


function getCaseArround(caseCenter) {
	let out = []
	
	for (let x = caseCenter.case.position.x - 1; x <= caseCenter.case.position.x + 1; x++) {
		for (let y = caseCenter.case.position.y - 1; y <= caseCenter.case.position.y + 1; y++) {
			if(mapArray[x] != undefined && mapArray[x][y] != undefined && mapArray[x][y] != caseCenter) {
				out.push(mapArray[x][y])
			}
		}
	}

	return out
}


function getLowestGlobalFromOpen() {
	let lowest
	
	for(let i = 0; i < open.length; i++) {
		if(!lowest || lowest.global > open[i].global) {
			lowest = open[i]
		}
	}

	return lowest
}


function removeElementFromArray(arrayIn, element) {
	let out = []

	for(let i = 0; i < arrayIn.length; i++) {
		if(arrayIn[i].case.position != element.case.position) {
			out.push(arrayIn[i])
		}
	}

	return out
}


function elementExistInArray(arrayIn, element) {
	for(let i = 0; i < arrayIn.length; i++) {
		if(arrayIn[i].case.position == element.position) {
			return true
		}
	}

	return false
}
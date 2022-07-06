const { USDMClient } = require('binance')

const API_KEY = ''
const API_SECRET = ''

const client = new USDMClient({
  api_key: API_KEY,
  api_secret: API_SECRET,
})

let symbol = 'ETHUSDT'
let seniorTimeFrame = '1h'
let lowerTimeFrame = '5m'
let limit = 1000
// let candlesFutures = []
let globalSumProfit = 0
const startProgramAt = new Date().getTime() // для расчета времени работы приложения
let startOfTrend = 0 // для подсчета кол-ва торговых дней
let maxOfTrend = 0 // максимальное кол-во свечей в тренде
let statInTredn = [] // для статистики внутри тренда
let jj = 0

// let dealsGlobal = []
// startProgram() // запуск обычный. Требуется активировать глобальную переменную dealsGlobal
startProgram2() // запуск через асинхронные функции

function startProgram() {
  client
    .getKlines({ symbol: symbol, interval: seniorTimeFrame, limit: limit })
    .then((result) => {
      return candlesToObject(result) // преобразуем массив в объект
    })
    .then((candlesSenior) => {
      return findTrends(candlesSenior) // определяем тренды
    })
    .then((trends) => {
      return getTrends(trends)
    })
    .then((printValue) => {
      //console.log('результат выполнения всего приложения (!!!):')
      // console.table(printValue)
      //printGlobalProfit(printValue)
      setTimeout(printGlobalProfit, 5000, printValue)
    })
    .catch((err) => {
      console.error('getAccountTradeList error: ', err)
    })
}

async function startProgram2() {
  const delay = (ms) => {
    return new Promise((response) => setTimeout(() => response(), ms))
  }
  try {
    const candlesSenior = await client.getKlines({
      symbol: symbol,
      interval: seniorTimeFrame,
      limit: limit,
    })
    const objectSenior = candlesToObject(candlesSenior)
    const trends = findTrends(objectSenior)
    const deals = await getTrendsAsync(trends)
    // await delay(5000)
    printGlobalProfit(deals)
  } catch (err) {
    console.error('getAccountTradeList error: ', err)
  }
}

function usdmBalance() {
  client
    .getBalance()
    .then((result) => {
      // console.log("getBalance result: ", result);
      console.log('getBalance result: ')
      console.table(result)
    })
    .catch((err) => {
      console.error('getBalance error: ', err)
    })
}

function candlesToObject(arg) {
  let target = []
  arg.forEach(function (item, i, arg) {
    target[i] = {
      openTime: item[0],
      // openTimeH: timestampToDateHuman(item[0]),
      openPrice: Number(item[1]),
      highPrice: Number(item[2]),
      lowPrice: Number(item[3]),
      closePrice: Number(item[4]),
    }
  })
  return target
}

function timestampToDateHuman(arg) {
  let bbb = new Date(arg)
  const year = bbb.getFullYear()
  const month = bbb.getMonth() + 1
  const date = bbb.getDate()
  const hours = bbb.getHours()
  const minutes = bbb.getMinutes()
  return `${year}.${month}.${date} at ${hours}:${minutes}`
}

function printGlobalProfit(dealsKostil) {
  //dealsKostil = dealsGlobal // костыль
  console.log('')
  console.log(`ОБЩАЯ СТАТИСТИКА:`)
  console.log(
    `symbol = ${symbol} | старший ТФ = ${seniorTimeFrame} | младший ТФ = ${lowerTimeFrame}`
  )
  console.log(
    `Общая сумма прибыли globalSumProfit = ${+globalSumProfit.toFixed(
      2
    )} USD (суммируется внутри функции trade)`
  )
  //console.log(`Общее кол-во сделок (Длина массива globalDeals) = ${globalDeals.length} шт`)
  console.log(
    `Общее кол-во сделок (Длина массива dealsGlobal) = ${dealsKostil.length} шт`
  )

  const deposit = dealsKostil[0].openPrice // как будто депозит равен цене первого хая из массива трендов
  const roi = (globalSumProfit / deposit) * 100
  console.log(`ROI = ${+roi.toFixed(2)}%`)

  const currentTime = new Date().getTime() // текущая дата
  const diffInTime = currentTime - startOfTrend // Calculating the time difference between two dates
  const oneDay = 1000 * 60 * 60 * 24 // One day in milliseconds
  const diffInDays = Math.round(diffInTime / oneDay) // Calculating the no. of days between two dates
  console.log(`общее кол-во дней торговли = ${diffInDays}`)

  const roiPerYear = (365 * roi) / diffInDays
  console.log(`годовая доходность была бы: ${+roiPerYear.toFixed(2)}%`)

  let drawdown = []
  dealsKostil.forEach(function (item, i, deals) {
    drawdown.push(item.profit)
  })
  let min = Math.min.apply(null, drawdown)
  console.log(
    `Максимальная просадка = ${min} USD (${
      Math.round((min / deposit) * 10000) / 100
    } %)`
  )

  console.log(`максимальное кол-во свечей в младшем ТФ = ${maxOfTrend} штук`)

  // сортировка массива со сделками
  dealsKostil.sort((a, b) => a.openTimestamp - b.openTimestamp)

  // проверка вычисления прибыли по глобальному массиву deals
  let sumTest = 0
  dealsKostil.forEach(function (item, i, deadealsKostills) {
    if (typeof item.profit == 'number')
      if (item.profit != '') {
        sumTest += item.profit
      }
  })
  console.log(
    `итоговая прибыль = ${+sumTest.toFixed(2)} USD (проверка по dealsKostil)`
  )

  console.log('')
  console.log('Все сделки (вывод dealsKostil):')
  console.table(dealsKostil)

  // статистика по сделкам
  let countOfPositive = 0
  let countOfNegative = 0
  let countOfZero = 0
  dealsKostil.forEach(function (item, i, dealsKostil) {
    if (item.profit > 0) {
      countOfPositive++
    } else if (item.profit < 0) {
      countOfNegative++
    } else countOfZero++
  })
  console.log('')
  console.log(`кол-во положительных сделок = ${countOfPositive}`)
  console.log(`кол-во отрицательных сделок = ${countOfNegative}`)
  console.log(`кол-во нулевых сделок = ${countOfZero}`)
  console.log(
    `всего сделок = ${countOfPositive + countOfNegative + countOfZero}`
  )

  // статистика сделок по трендам
  statInTredn.sort((a, b) => a.indexOfTrend - b.indexOfTrend)
  console.log('')
  console.log('статистика сделок по трендам:')
  console.table(statInTredn)
  let sumTestStat = 0
  statInTredn.forEach(function (item, i, statInTredn) {
    if (typeof item.profitInTrend == 'number')
      if (item.profitInTrend != '') {
        sumTestStat += item.profitInTrend
      }
  })
  console.log(
    `итоговая прибыль = ${+sumTestStat.toFixed(
      2
    )} USD (проверка по statInTredn)`
  )

  // вычисление времени работы всего скрипта
  const endProgram = new Date().getTime() // текущая дата
  const diffInTimeProgram = endProgram - startProgramAt
  const OneSecond = 1000
  const diffInSecond = Math.round(diffInTimeProgram / OneSecond)
  console.log(
    `время выполнения скрипта = ${diffInSecond} секунд (${
      diffInSecond / 60
    } минут)`
  )

  console.log('программа завершена (ОК)')
}

function findTrends(arg) {
  let FractalsUp = false // факт наличия фрактала на старшем ТФ
  let FractalsDown = false
  let FractalsUpPrice = 0 // значение цены фрактала
  let FractalsDownPrice = 0
  let FractalUpTime = '' // человеческий вид времи фрактала для проверки работы условий
  let FractalDownTime = ''
  let whatTrend = []
  let numberOfTrend = 0
  let whatTrendFiltered = []
  let j = 0

  for (let i = 4; i < arg.length; i++) {
    // ищем Bearish (медвежий) Fractal. Факртал находится на позиции [i-2]
    if (
      arg[i - 4].highPrice < arg[i - 2].highPrice &&
      arg[i - 3].highPrice < arg[i - 2].highPrice &&
      arg[i - 1].highPrice < arg[i - 2].highPrice &&
      arg[i].highPrice < arg[i - 2].highPrice
    ) {
      //fractalsOfTrend.push(['Bearish Fractal', arg[i-2].highPrice, timestampToDateHuman(arg[i-2].openTime), timestampToDate(arg[i-2].openTime)])
      FractalsUp = true
      FractalsUpPrice = arg[i - 2].highPrice
      FractalUpTime = arg[i - 2].openTime
    } else {
      // ищем Bullish (бычий) Fractal
      if (
        arg[i - 4].lowPrice > arg[i - 2].lowPrice &&
        arg[i - 3].lowPrice > arg[i - 2].lowPrice &&
        arg[i - 1].lowPrice > arg[i - 2].lowPrice &&
        arg[i].lowPrice > arg[i - 2].lowPrice
      ) {
        //fractalsOfTrend.push(['Bullish Fractal', arg[i-2].lowPrice, timestampToDateHuman(arg[i-2].openTime), timestampToDate(arg[i-2].openTime)])
        FractalsDown = true
        FractalsDownPrice = arg[i - 2].lowPrice
        FractalDownTime = arg[i - 2].openTime
      }
    }
    // определяем тренды
    // PS в реальном времени необходимо сравнивать фрактал с текущей ценой на рынке
    if (FractalsDown) {
      if (arg[i].lowPrice < FractalsDownPrice) {
        //whatTrend3.push(['DownTrend', arg[i].lowPrice, arg[i].openTime]) // тренд между цинами пробития фракталов
        whatTrend[numberOfTrend] = {
          trend: 'DownTrend',
          fractalTime: timestampToDateHuman(FractalDownTime),
          // ftactalTimeStamp: FractalDownTime,
          fractalPrice: FractalsDownPrice,
          priceTimeStamp: arg[i].openTime,
          priceTime: timestampToDateHuman(arg[i].openTime),
          price: arg[i].lowPrice,
        }
        numberOfTrend += 1
        FractalsDown = false
        trendDown = true
        trendUp = false
      }
    }
    if (FractalsUp) {
      if (arg[i].highPrice > FractalsUpPrice) {
        //whatTrend3.push(['UpTrend', arg[i].highPrice, arg[i].openTime]) // тренд между цинами пробития фракталов
        whatTrend[numberOfTrend] = {
          trend: 'UpTrend',
          fractalTime: timestampToDateHuman(FractalUpTime),
          // ftactalTimeStamp: FractalUpTime,
          fractalPrice: FractalsUpPrice,
          priceTimeStamp: arg[i].openTime,
          priceTime: timestampToDateHuman(arg[i].openTime),
          price: arg[i].highPrice, // поле носит чисто ифнормационный характер
        }
        numberOfTrend += 1
        FractalsUp = false
        trendUp = true
        trendDown = false
      }
    }
  }

  // фильтруем массив c трендами: удаляем повторяющиеся тренды
  whatTrendFiltered[j] = whatTrend[0]
  for (let i = 1; i < whatTrend.length; i++) {
    if (whatTrendFiltered[j].trend == whatTrend[i].trend) continue
    else {
      j++
      whatTrendFiltered[j] = whatTrend[i]
    }
  }

  console.log('тренды (без фильтрации):')
  console.table(whatTrend)

  console.log('тренды (после фильтрации):')
  console.table(whatTrendFiltered)

  // console.log('тренды для обработки с датой для binance после фильтрации')
  // console.table(whatTrendTrue)
  // console.log(`общее кол-во трендов = ${whatTrendTrue.length} шт (вызов из функции findTrends)`)
  console.log(
    `общее кол-во трендов = ${whatTrendFiltered.length} шт (вызов по whatTrendFiltered из функции findTrends)`
  )
  startOfTrend = whatTrendFiltered[0].priceTimeStamp

  return whatTrendFiltered
}

async function getTrendsAsync(array) {
  let dealsGlobal = [] // перенесено в глобальную переменную, т.к. функция возвращает значение еще до завершения расчета сделок по трендам
  // let temp = []
  const currentTime = new Date().getTime()
  //let summProfit = 0
  // globalTimeOut = (array.length + 1) * 5000
  console.log(
    `общее кол-во трендов = ${array.length} шт (передано в функцию getTrends)`
  )
  const oneHourStamp = 1000 * 60 * 60

  for (let i = 0; i < array.length; i++) {
    if (i != array.length - 1) {
      try {
        // const candlesJunior = await client.getKlines({ symbol: symbol, interval: lowerTimeFrame, startTime: array[i].priceTimeStamp, endTime: (array[i+1].priceTimeStamp + oneHourStamp), limit: 1000})
        const candlesJunior = await client.getKlines({
          symbol: symbol,
          interval: lowerTimeFrame,
          startTime: array[i].priceTimeStamp,
          endTime: array[i + 1].priceTimeStamp,
          limit: 1000,
        })
        const objectJunior = candlesToObject(candlesJunior)
        console.log('')
        console.log(`обработка данных ${i}-го тренда...`)
        console.log(
          `Длина ${i} тренда составляет ${objectJunior.length} свечей`
        )
        console.log(
          `Начало тренда: ${timestampToDateHuman(
            array[i].priceTimeStamp
          )}, заверщение тренда: ${timestampToDateHuman(
            array[i + 1].priceTimeStamp
          )}`
        )

        // вычисляем самый длинный массив младшего ТФ
        if (maxOfTrend < objectJunior.length) {
          maxOfTrend = objectJunior.length
        }
        // temp = await trade(objectJunior, array[i].trend, i)
        // dealsGlobal = await dealsGlobal.concat(temp)
        dealsGlobal = dealsGlobal.concat(trade(objectJunior, array[i].trend, i))
      } catch (err) {
        console.error('getAccountTradeList error: ', err)
      }
    } else {
      // если это последний тренд, то берем текущую последнюю дату
      try {
        const candlesJunior = await client.getKlines({
          symbol: symbol,
          interval: lowerTimeFrame,
          startTime: array[i].priceTimeStamp,
          endTime: currentTime,
          limit: 1000,
        })
        const objectJunior = candlesToObject(candlesJunior)
        console.log('')
        console.log(`обработка данных ${i}-го тренда...`)
        console.log(
          `Длина ${i} тренда составляет ${objectJunior.length} свечей`
        )
        console.log(
          `Начало тренда: ${timestampToDateHuman(
            array[i].priceTimeStamp
          )}, заверщение тренда: ${timestampToDateHuman(currentTime)}`
        )

        // вычисляем самый длинный массив младшего ТФ
        if (maxOfTrend < objectJunior.length) {
          maxOfTrend = objectJunior.length
        }
        // temp = await trade(objectJunior, array[i].trend, i)
        // dealsGlobal = await dealsGlobal.concat(temp)
        dealsGlobal = dealsGlobal.concat(trade(objectJunior, array[i].trend, i))
      } catch (err) {
        console.error('getAccountTradeList error: ', err)
      }
    }
  }

  // console.log(`общая прибыль составляет (функция getTrends) = ${summProfit}`)
  // console.log('ЗАВЕРШЕНИЕ функции getTrends')
  // console.log(`передано из getTrends общее кол-во сделок: ${dealsGlobal.length}`)
  return dealsGlobal
}

function trade(array, trend, index) {
  let FractalsUp = false // факт наличия фрактала на младшем ТФ
  let FractalsDown = false
  let FractalsUpPrice = 0 // значение цены фрактала
  let FractalsDownPrice = 0
  let FractalUpTime = 0 // время фрактала для проверки работы условий
  let FractalDownTime = 0
  let stopLoss = 0
  let inLongPosition = false
  let inShortPosition = false
  let numberOfPosition = 0
  //let deals = [] // [ long/short, buy/sell, price, human(open time deal), timestamp(open time deal), sell/buy, price, close time deal ]
  let positionUp = 0
  let positionDown = 0
  let positionTime = 0
  let lastFractal = 0 // для закрытия сделок в конце тренда
  let deals = []

  console.log(`передаваемое значение тренда = ${trend}`)
  // console.log('тип трендовой переменной: ' + typeof(trend))
  // console.log('переданный массив')
  // console.log(array)

  // в цикле ищем фракталы внутри тренда на младщем ТФ и запускаем сделки
  for (let i = 4; i < array.length; i++) {
    if (
      array[i - 4].lowPrice > array[i - 2].lowPrice &&
      array[i - 3].lowPrice > array[i - 2].lowPrice &&
      array[i - 1].lowPrice > array[i - 2].lowPrice &&
      array[i].lowPrice > array[i - 2].lowPrice
    ) {
      FractalsDown = true
      FractalsDownPrice = array[i - 2].lowPrice
      // FractalDownTime = array[i-2][0]
      // console.log(`фрактал снизу =  ${FractalsDownPrice}, дата ${timestampToDateHuman(FractalDownTime)}`)
    } else if (
      array[i - 4].highPrice < array[i - 2].highPrice &&
      array[i - 3].highPrice < array[i - 2].highPrice &&
      array[i - 1].highPrice < array[i - 2].highPrice &&
      array[i].highPrice < array[i - 2].highPrice
    ) {
      // fractalsOfTrend.push(['Bearish Fractal', Number(array[i-2][2]), array[i-2][0], array[i-2][0]])
      FractalsUp = true
      FractalsUpPrice = array[i - 2].highPrice
      // FractalUpTime = array[i-2][0]
    }

    if (trend == 'UpTrend') {
      // console.log('ищем вход внутри UpTrend')
      if (FractalsUp) {
        // console.log(`есть фрактал: ${FractalsUpPrice}`)
        if (!inLongPosition) {
          if (array[i].highPrice > FractalsUpPrice) {
            stopLoss = FractalsDownPrice
            lastFractal = FractalsDownPrice
            //deals.push(['LONG', 'Buy', Number(array[i][2]), timestampToDateHuman(array[i][0]), array[i][0]])
            /*                            
                      dealsClass[numberOfPosition] = {
                          openPosition: 'Buy', 
                          openPrice: Number(array[i][2]), 
                          openTime: timestampToDateHuman(array[i][0]), 
                          openTimestamp: array[i][0]
                      }                           
                      */
            // globalDeals.push(['LONG', 'Buy', Number(array[i][2]), timestampToDateHuman(array[i][0])])
            // FractalsUp = false
            // FractalsUpPrice = 0
            // positionUp = Number(array[i][2])
            positionUp = FractalsUpPrice // вход в позицию по цене фрактала
            inLongPosition = true
            positionTime = array[i].openTime
            // console.log('зашли в позицию')
          }
        } else if (inLongPosition) {
          if (FractalsDownPrice > stopLoss) {
            stopLoss = FractalsDownPrice
            lastFractal = FractalsDownPrice
          }
          if (array[i].lowPrice < stopLoss) {
            //deals[numberOfPosition].push('Sell', Number(array[i][3]), timestampToDateHuman(array[i][0]), +(Number(array[i][3])-positionUp).toFixed(2))
            // globalDeals[numberOfPosition].push('Sell', Number(array[i][3]), timestampToDateHuman(array[i][0]))

            // dealsClass.closePosition = 'Sell'
            // dealsClass.closePrice = Number(array[i][3])
            // dealsClass.closeTime = timestampToDateHuman(array[i][0])
            // dealsClass.profit = +(Number(array[i][3])-positionUp).toFixed(2)

            deals[numberOfPosition] = {
              openPosition: 'Buy',
              openPrice: positionUp,
              openTime: timestampToDateHuman(positionTime),
              openTimestamp: positionTime,
              closePosition: 'Sell',
              // closePrice: Number(array[i][3]),
              closePrice: stopLoss, // выходим по цене Stop Loss
              closeTime: timestampToDateHuman(array[i].openTime),
              profit: +(array[i].lowPrice - positionUp).toFixed(2),
              percent: +(
                ((array[i].lowPrice - positionUp) / positionUp) *
                100
              ).toFixed(2),
              stopLoss: stopLoss,
            }

            inLongPosition = false
            stopLoss = 0
            numberOfPosition += 1
            positionUp = 0
            positionTime = 0
            // console.log('вышли из позиции')
            FractalsUp = false
            FractalsUpPrice = 0
          } else if (i == array.length - 1) {
            if (array[i].lowPrice >= lastFractal) {
              //deals[numberOfPosition].push('Sell', Number(array[i][3]), timestampToDateHuman(array[i][0]), +(Number(array[i][3])-positionUp).toFixed(2))

              deals[numberOfPosition] = {
                openPosition: 'Buy',
                openPrice: positionUp,
                openTime: timestampToDateHuman(positionTime),
                openTimestamp: positionTime,
                closePosition: 'Sell',
                closePrice: array[i].lowPrice,
                closeTime: timestampToDateHuman(array[i].openTime),
                profit: +(array[i].lowPrice - positionUp).toFixed(2),
                percent: +(
                  ((array[i].lowPrice - positionUp) / positionUp) *
                  100
                ).toFixed(2),
                lastPrice: array[i].lowPrice,
              }
            } else {
              //deals[numberOfPosition].push('Sell', lastFractal, timestampToDateHuman(array[i][0]), lastFractal-positionUp)

              // продумать как на боевом роботе будут закрываться позиции после окончания тренда,
              // т.к. ниже позиция закрывается по последнему фракталу
              deals[numberOfPosition] = {
                openPosition: 'Buy',
                openPrice: positionUp,
                openTime: timestampToDateHuman(positionTime),
                openTimestamp: positionTime,
                closePosition: 'Sell',
                closePrice: lastFractal,
                closeTime: timestampToDateHuman(array[i].openTime),
                profit: lastFractal - positionUp,
                percent: +(
                  ((lastFractal - positionUp) / positionUp) *
                  100
                ).toFixed(2),
                lf: lastFractal,
              }
            }
            lastFractal = 0
          }
        }
      }
    } else if (trend == 'DownTrend') {
      if (FractalsDown) {
        if (!inShortPosition) {
          //stopLoss = FractalsUpPrice
          //lastFractal = FractalsUpPrice
          if (array[i].lowPrice < FractalsDownPrice) {
            stopLoss = FractalsUpPrice
            lastFractal = FractalsUpPrice
            //deals.push(['SHORT', 'Sell', Number(array[i][3]), timestampToDateHuman(array[i][0]), array[i][0]])
            // globalDeals.push(['SHORT', 'Sell', Number(array[i][3]), timestampToDateHuman(array[i][0])])
            // FractalsUp = false
            // FractalsUpPrice = 0
            inShortPosition = true
            //positionDown = Number(array[i][3])
            positionDown = FractalsDownPrice // открываем short по цене фрактала
            positionTime = array[i].openTime
            // console.log('зашли в позицию')
          }
        } else if (inShortPosition) {
          if (FractalsUpPrice < stopLoss) {
            stopLoss = FractalsUpPrice
            lastFractal = FractalsUpPrice
          }
          //if (stopLoss > 0)
          if (array[i].highPrice > stopLoss) {
            // deals[numberOfPosition].push('Buy', Number(array[i][2]), timestampToDateHuman(array[i][0]), +(positionDown - Number(array[i][2])).toFixed(2))
            // globalDeals[numberOfPosition].push('Buy', Number(array[i][2]), timestampToDateHuman(array[i][0]))
            if (stopLoss > 0) {
              // бывают ситуации, когда в начале нового тренда верхний фрактал еще не сформировался
              deals[numberOfPosition] = {
                openPosition: 'Sell',
                openPrice: positionDown,
                openTime: timestampToDateHuman(positionTime),
                openTimestamp: positionTime,
                closePosition: 'Buy',
                // closePrice: Number(array[i][2]),
                closePrice: stopLoss, // выходим по цене Stol Loss
                closeTime: timestampToDateHuman(array[i].openTime),
                profit: +(positionDown - array[i].highPrice).toFixed(2),
                percent: +(
                  ((positionDown - array[i].highPrice) / positionDown) *
                  100
                ).toFixed(2),
                stopLoss: stopLoss,
              }

              inShortPosition = false
              stopLoss = 0
              numberOfPosition += 1
              positionDown = 0
              // console.log('вышли из позиции')
              FractalsDown = false
              FractalsDownPrice = 0
              positionTime = 0
            }
          } else if (i == array.length - 1) {
            if (array[i].highPrice <= lastFractal) {
              //deals[numberOfPosition].push('Buy', Number(array[i][2]), timestampToDateHuman(array[i][0]), +(positionDown - Number(array[i][2])).toFixed(2))

              deals[numberOfPosition] = {
                openPosition: 'Sell',
                openPrice: positionDown,
                openTime: timestampToDateHuman(positionTime),
                openTimestamp: positionTime,
                closePosition: 'Buy',
                closePrice: array[i].highPrice,
                closeTime: timestampToDateHuman(array[i].openTime),
                profit: +(positionDown - array[i].highPrice).toFixed(2),
                percent: +(
                  ((positionDown - array[i].highPrice) / positionDown) *
                  100
                ).toFixed(2),
                lastPrice: array[i].highPrice,
              }
            } else {
              //deals[numberOfPosition].push('Buy', lastFractal, timestampToDateHuman(array[i][0]), positionDown-lastFractal)

              deals[numberOfPosition] = {
                openPosition: 'Sell',
                openPrice: positionDown,
                openTime: timestampToDateHuman(positionTime),
                openTimestamp: positionTime,
                closePosition: 'Buy',
                closePrice: lastFractal,
                closeTime: timestampToDateHuman(array[i].openTime),
                profit: positionDown - lastFractal,
                percent: +(
                  ((positionDown - lastFractal) / positionDown) *
                  100
                ).toFixed(2),
                lf: lastFractal,
              }
            }
            lastFractal = 0
          }
        }
      }
    }
  }

  console.log('сделки внутри функции trade:')
  console.table(deals)

  //globalDeals = globalDeals.concat(deals)
  //!!! dealsClassGlobal = dealsClassGlobal.concat(dealsClass)

  console.log(
    `кол-во сделок внутри тренда = ${deals.length} штук (внутри функции trade)`
  )

  // подсчет прибыли внутри тренда по dealsClass
  let summProfit = 0
  deals.forEach(function (item, i, deals) {
    if (typeof item.profit == 'number') summProfit += item.profit
  })
  console.log(
    `прибыль внутри тренда = ${+summProfit.toFixed(
      2
    )} USD (функция считает по полю profit)`
  )
  globalSumProfit += summProfit

  // для статистики внутри трендов
  statInTredn[jj] = {
    indexOfTrend: index,
    trendIs: trend,
    startTrend: timestampToDateHuman(array[0].openTime),
    endTrend: timestampToDateHuman(array[array.length - 1].openTime),
    profitInTrend: +summProfit.toFixed(2),
  }
  jj++

  return deals
}

// тестовые функции
function findFractals(arg) {}

function getTrends2(array) {
  console.log(
    `общее кол-во трендов = ${array.length} шт (передано в функцию getTrends)`
  )
  console.table(array)
}

function getTrends(array) {
  // let dealsGlobal = [] // перенесено в глобальную переменную, т.к. функция возвращает значение еще до завершения расчета сделок по трендам
  let temp = []
  const currentTime = new Date().getTime()
  //let summProfit = 0
  // const candlesArray2 = array
  // globalTimeOut = (array.length + 1) * 5000
  console.log(
    `общее кол-во трендов = ${array.length} шт (передано в функцию getTrends)`
  )
  //console.log(array[1].priceTimeStamp)
  //console.log(`priceTimeStamp[0] = ${array[0].priceTimeStamp}`)
  const oneHourStamp = 1000 * 60 * 60

  for (let i = 0; i < array.length; i++) {
    if (i != array.length - 1) {
      // console.log(`промежуточная i = ${i}`)
      // client.getKlines({ symbol: symbol, interval: lowerTimeFrame, startTime: array[i].priceTimeStamp, endTime: (array[i+1].priceTimeStamp + oneHourStamp), limit: 1000})
      client
        .getKlines({
          symbol: symbol,
          interval: lowerTimeFrame,
          startTime: array[i].priceTimeStamp,
          endTime: array[i + 1].priceTimeStamp,
          limit: 1000,
        })
        //client.getKlines({ symbol: symbol, interval: lowerTimeFrame, startTime: 1656669600000, endTime: 1656914400000, limit: 1000})
        .then((response) => {
          // console.log('свечи внутри тренда:')
          // console.table(response.data)
          candles = candlesToObject(response)
          //candles = response.data
          // console.log('')
          // console.log(`кол-во свечей внутри ${i}-го тренда = ${candles.length}`)
          // console.log(`список ${i}-го тренда:`)
          // console.table(candles)
        })
        .then(() => {
          console.log('')
          console.log(`обработка данных ${i}-го тренда...`)
          console.log(`Длина ${i} тренда составляет ${candles.length} свечей`)
          console.log(
            `Начало тренда: ${timestampToDateHuman(
              array[i].priceTimeStamp
            )}, заверщение тренда: ${timestampToDateHuman(
              array[i + 1].priceTimeStamp
            )}`
          )
          // console.log(`плюс 1 час = ${timestampToDateHuman(oneHourStamp + array[i+1].priceTimeStamp)}`)

          // вычисляем самый длинный массив младшего ТФ
          if (maxOfTrend < candles.length) {
            maxOfTrend = candles.length
          }

          // summProfit += trade(candles, array[i][0])
          // setTimeout(trade, i * 5000, candles, array[i][0])
          // trade(candles, array[i][0])
          // dealsClassGlobal = dealsClassGlobal.concat(trade(candles, array[i][0]))
          temp = trade(candles, array[i].trend, i)
          // console.log(`Кол-во возвращенных сделок ${i} тренда = ${temp.length}`)
          dealsGlobal = dealsGlobal.concat(temp)
          // console.log(`Суммарно сделок = ${dealsGlobal.length}`)
        })
        .catch((err) => {
          console.error('getAccountTradeList error: ', err)
        })
    } else {
      // если это последний тренд, то берем текущую последнюю дату
      client
        .getKlines({
          symbol: symbol,
          interval: lowerTimeFrame,
          startTime: array[i].priceTimeStamp,
          endTime: currentTime,
          limit: 1000,
        })
        .then((response) => {
          candles = candlesToObject(response)
        })
        .then(() => {
          console.log('')
          console.log(`обработка данных ${i}-го тренда...`)
          console.log(`Длина ${i} тренда составляет ${candles.length} свечей`)
          console.log(
            `Начало тренда: ${timestampToDateHuman(
              array[i].priceTimeStamp
            )}, заверщение тренда: ${timestampToDateHuman(currentTime)}`
          )
          // summProfit += trade(candles, array[i][0])
          // setTimeout(trade, i * 5000, candles, array[i][0])
          // trade(candles, array[i][0])
          //dealsClassGlobal = dealsClassGlobal.concat(trade(candles, array[i][0]))
          temp = trade(candles, array[i].trend, i)
          // console.log(`Кол-во возвращенных сделок ${i} тренда = ${temp.length}`)
          dealsGlobal = dealsGlobal.concat(temp)
          // console.log(`Суммарно сделок = ${dealsGlobal.length}`)
        })
        .catch((err) => {
          console.error('getAccountTradeList error: ', err)
        }) /*
              .then(() => { // удалить цепочку
                console.log(`итого общее кол-во сделок (dealsGlobal) = ${dealsGlobal.length} (конец функции getTrends)`)
                console.log('все сделки: (конец функции getTrends)')
                console.table(dealsGlobal)
                // return dealsGlobal
              })*/
    }
  }
  // dealsClassGlobalTemp = dealsClassGlobalTemp.concat(dealsClassGlobal) // реализация костыля

  // console.log(`общая прибыль составляет (функция getTrends) = ${summProfit}`)
  // console.log('ЗАВЕРШЕНИЕ функции getTrends')
  // console.log(`передано из getTrends общее кол-во сделок: ${dealsGlobal.length}`)
  // return dealsGlobal
}

function printGlobalProfit2(arg) {
  console.log('')
  console.log('ИТОГОВЫЙ РЕЗУЛЬТАТ (вызов из функции printGlobalProfit):')
  console.table(dealsGlobal)
  console.log(
    `длина передаваемого массива в функцию (printValue) = ${dealsGlobal.length}`
  )

  const endProgram = new Date().getTime() // текущая дата
  const diffInTimeProgram = endProgram - startProgramAt
  const OneSecond = 1000
  const diffInSecond = Math.round(diffInTimeProgram / OneSecond)
  console.log('')
  console.log(
    `время выполнения скрипта = ${diffInSecond} секунд (${
      diffInSecond / 60
    } минут)`
  )
}

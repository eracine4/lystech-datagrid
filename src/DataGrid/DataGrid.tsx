import * as React from 'react'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import './DataGrid.scss'
import IDatagridProps from './IDatagridProps'

const ascSymbol = '🠹'
const descSymbol = '🠻'
const nextSymbol = '»'
const prevSymbol = '«'

const minusSymbol = '➖'
const plusSymbol = '➕'

let clickTimeout: any = undefined

export default function DataGrid(props: IDatagridProps) {
  const ref = useRef(null)
  const [currentPage, setCurrentPageVar] = useState(0)
  const [itemsPerPage] = useState(props.itemsPerPage ? props.itemsPerPage : 10)
  const [allDatas, setAllDatas] = useState<any>(props.dataSource)
  const [currentDatas, setCurrentDatas]: any[] = useState(undefined)
  const [primaryKey, setPrimaryKey] = useState(props.primaryKey)
  const [columns] = useState(props.columns)
  const [columnsOptions] = useState(props.columnsOptions)
  const [otherColumns] = useState(props.otherColumns)

  const [allowSelection] = useState(props.allowSelection)
  const [showCheckBoxes] = useState(props.showCheckBoxes)
  const [allowEdition] = useState(props.allowEdition)

  const [elementIndex] = useState('datagrid_' + props.index)

  const [collapsed, setCollapsed] = useState(props.collapsed)
  const [canCollapse] = useState(props.canCollapse)

  const [globalCommandButtons] = useState(props.globalCommandButtons)
  const [sorting, setSorting]: any = useState({
    field: '',
    direction: '',
  })
  const [ignoreFields] = useState(
    props.ignoreFields === undefined ? [] : props.ignoreFields
  )
  const [hideColumns] = useState(props.hideColumns)
  const [searchParams, setSearchParams] = useState({})
  const [rowsDatas, setRowsData]: any = useState(undefined)
  const [initialized, setInitialized] = useState(false)

  const [updateCount, setUpdateCount] = useState(0)

  useLayoutEffect(() => {
    tryValidatePrimaryKey()

    if (!initialized) {
      if (allDatas) {
        initializeDatas()
      }
      updateCurrentDatas()

      if (allDatas) setInitialized(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    initializeDatas()
    setInitialized(true)

    updateCurrentDatas()

    forceUpdateGrid(props.dataSource)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props])

  useEffect(() => {
    forceUpdateGrid()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentPage])

  useEffect(() => {
    forceUpdateGrid()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting])

  useEffect(() => {}, [allDatas])

  function getIsMobile() {
    let isMobile = document.body.clientWidth <= 576
    return isMobile
  }

  function getUniqueElementID() {
    let id = generateRandomString(10)
    let existingElem = document.getElementById(id)
    while (existingElem) {
      id = generateRandomString(10)
      existingElem = document.getElementById(id)
    }
    return id
  }

  function generateRandomString(length: number) {
    var result = ''
    var characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }

  // Initialisation initial des données et colonnes pour le tableau de données.
  function initializeSearchParams() {
    if (!allDatas) return

    let searchParams = {}

    if (columnsOptions?.allowAllSearch) {
      if (allDatas !== undefined) {
        if (allDatas.length > 0) {
          let item = allDatas[0]
          for (var f in item) {
            searchParams[f] = ''
          }
        }
      }
    } else {
      if (columns !== undefined) {
        if (Object.keys(columns).length > 0) {
          for (var ff in columns) {
            if (columns[ff].allowSearch) {
              searchParams[ff] = ''

              // if (f === 'id') {
              //   searchParams[f] = "2";
              // }
            }
          }
        }
      }
    }
    setSearchParams(searchParams)
  }

  function initializeRowsDatas() {
    tryValidatePrimaryKey()

    if (!primaryKey) return

    let allDatasRows = rowsDatas
    allDatasRows = []

    if (allDatas?.length > 0) {
      for (let i = 0; i < allDatas.length; i++) {
        if (!allDatas[i] || !allDatas[i]['rowID']) {
          break
        }

        allDatas[i]["rowID"] = 'rowID_' + i

        allDatasRows.push({
          // rowID: allDatas[i]["rowID"],
          rowID: 'rowID_' + i,
          datas: allDatas[i],
          selected: false,
          inEditMode: false,
          tempValue: undefined,
        })
      }
      setRowsData(allDatasRows)
    }
  }

  function tryValidatePrimaryKey() {
    if (allDatas) {
      // check if data has a property with the same name as the primary key
      if (allDatas.length > 0) {
        if (!allDatas[0]?.hasOwnProperty(primaryKey)) {
          // set the primary key to the first property of the first object
          if (allDatas[0]) setPrimaryKey(Object.keys(allDatas[0])[0])
        }
      }
    }
  }

  function initializeDatas() {
    // if (!allDatas)
    //   return;

    initializeSearchParams()
    initializeRowsDatas()

    // setTimeout(
    //   function () {
    //     refreshDatasFromGrid();
    //   },
    //   10
    // );
  }

  // Permet d'obtenir l'entiereté de la table
  if (!props.isLoading && allDatas && allDatas?.length > 0) {
    return <>{getTable()}</>
  } else {
    return <>{getEmptyTable(props.isLoading ? props.isLoading : false)}</>
  }

  // Permet d'obtenir les boutons de paging et leur conteneur
  function getPaging() {
    if (!allDatas || allDatas?.length <= 0) {
      return <></>
    }
    let filteredDataLenght = allDatas
      ?.slice()
      ?.filter(getFilteredDatasForSearchParams())?.length
    let pages = filteredDataLenght > 0 ? filteredDataLenght / itemsPerPage : 0

    if (pages > 1) {
      return (
        <>
          <div className="paging-container">{getPagingButtons(pages)}</div>
        </>
      )
    } else {
      return <></>
    }
  }

  // Permet d'obtenir tous les boutons de paging en ordre ( <, 1, 2, 3, > etc..)
  function getPagingButtons(pages: number) {
    pages = Math.round(pages)

    let maxPagesDifference = getIsMobile() ? 2 : 3

    let buttons = []

    let key = 'dataGridPagingPrevButton_' + elementIndex
    //key = UtilityFunctions.tryUniquifyKey(key)

    let prevButton =
      currentPage !== 0 ? (
        <button
          key={key}
          id={key}
          className="paging-button"
          onClick={() => goToPrevPage()}
        >
          {prevSymbol}
        </button>
      ) : (
        <button key={key} id={key} className="paging-button" disabled>
          {prevSymbol}
        </button>
      )

    buttons.push(prevButton)

    if (currentPage > maxPagesDifference) {
      buttons.push(
        <button
          className="paging-button"
          key={'first_page_button'}
          onClick={() => setCurrentPage(0)}
        >
          1
        </button>
      )
      buttons.push(
        <button disabled className="paging-button">
          ..
        </button>
      )
    }

    for (let i = 0; i <= pages; i++) {
      let showButton = Math.abs(currentPage - i) < maxPagesDifference + 1
      if (showButton) {
        let key = 'dataGridPagingButton_' + elementIndex + i
        let button =
          currentPage !== i ? (
            <button
              key={key}
              id={key}
              className={getPagingButtonStyleClass(i)}
              onClick={() => setCurrentPage(i)}
            >
              {i + 1}
            </button>
          ) : (
            <button key={key} id={key} className={getPagingButtonStyleClass(i)}>
              {i + 1}
            </button>
          )
        buttons.push(button)
      } else {
      }
    }

    key = 'dataGridPaginNextButton' + elementIndex + currentPage
    let nextButton =
      currentPage < pages - 1 ? (
        <button
          key={key}
          id={key}
          className="paging-button"
          onClick={() => goToNextPage()}
        >
          {nextSymbol}
        </button>
      ) : (
        <button key={key} id={key} className="paging-button" disabled>
          {nextSymbol}
        </button>
      )

    if (pages > currentPage + maxPagesDifference) {
      buttons.push(
        <button disabled className="paging-button">
          ..
        </button>
      )
      buttons.push(
        <button
          key={'last_page'}
          id={key}
          className="paging-button"
          onClick={() => setCurrentPage(pages)}
        >
          {pages + 1}
        </button>
      )
    } else {
      ;<button
        key={'page_' + pages}
        id={key}
        className="paging-button"
        onClick={() => setCurrentPage(pages)}
      >
        {pages + 1}
      </button>
    }
    buttons.push(nextButton)

    return buttons
  }

  // Permet d'obtenir le style pour un bouton de paging (différent si c'est la page courante)
  function getPagingButtonStyleClass(page: number) {
    if (page === currentPage) {
      return 'paging-button paging-button-selected'
    } else {
      return 'paging-button'
    }
  }

  // Permet de rafraichir le tableau de donnés et reformater
  // après avoir éffectué une modification
  function forceUpdateGrid(datas?: any) {
    // console.log("Forced update on grid.")

    setUpdateCount(updateCount + 1)
    if (datas) setAllDatas(datas)

    // if (!allDatas) {
    //   return;
    // }

    setTimeout(function () {
      updateCurrentDatas()
      setCollapsed(props.collapsed)
    }, 35)
  }

  function showTitle() {
    let hasTitle = props.title && props.title != ''
    let showTitle =
      (props.showTitle === undefined && hasTitle) ||
      (props.showTitle === true && hasTitle)

    return showTitle
  }

  function updateCurrentDatas() {
    if (!allDatas) return

    // Fail safe if by this point, rowsDatas is still not initialized
    if (allDatas && !rowsDatas) initializeRowsDatas()

    let startIndex = currentPage * itemsPerPage
    let endIndex = startIndex + itemsPerPage

    // Sorting -> getting items from direction of asc or desc a-z, 0-9, etc..
    let newArray = allDatas?.slice()?.filter(getFilteredDatasForSearchParams())

    if (sorting.field !== '' && sorting.direction !== '') {
      if (sorting.direction === 'asc') {
        newArray = newArray.sort(function (a: any, b: any) {
          for (var curSortingField in a) {
            if (curSortingField === sorting.field) {
              if (a !== undefined)
                if (a[curSortingField] !== undefined) {
                  let valueA: any = a[curSortingField]
                  let useFunction = false
                  if (columns[curSortingField]?.overrideSortingValueFunction) {
                    valueA =
                      columns[curSortingField]?.overrideSortingValueFunction(a)
                    useFunction = true
                  }

                  let valueB: any = b[curSortingField]
                  if (useFunction) {
                    valueB =
                      columns[curSortingField]?.overrideSortingValueFunction(b)
                  }

                  if (isNumeric(valueA)) {
                    return Number.parseFloat(valueA) - Number.parseFloat(valueB)
                  } else if (isADate(valueA)) {
                    return valueA.getTime() - valueB.getTime()
                  } else {
                    return valueA.localeCompare(valueB)
                  }
                }
            }
          }
          return undefined
        })
        // Sorting *****
      } else if (sorting.direction === 'desc') {
        newArray = newArray.sort(function (a: any, b: any) {
          for (var f in a) {
            if (f === sorting.field) {
              let value = a[f].toString()
              if (isNumeric(value)) {
                return b[f] - a[f]
              } else if (isADate(value)) {
                return new Date(b[f]).getTime() - new Date(a[f]).getTime()
              } else {
                return b[f].localeCompare(a[f])
              }
            }
          }
          return newArray
        })
      }
    } else {
      newArray = allDatas.slice().filter(getFilteredDatasForSearchParams())
    }
    // Sorting *****

    // Parging after sorting
    if (allDatas) {
      newArray = newArray.slice(startIndex, endIndex)
    }

    if (newArray.length <= 0) {
      newArray.push(getEmptyData())
    }

    // Setting new currentDatas out of all datas.
    setCurrentDatas(newArray)
  }

  function getTable() {
    let headerCells = []
    if (!currentDatas && allDatas) updateCurrentDatas()
    if (!currentDatas) return <></>

    // Selection **
    let curItem = allDatas[0]
    if (allowEdition || (allowSelection && showCheckBoxes)) {
      let headerField = getSelectionHeaderCellContent()
      headerCells.push(headerField)
    }

    // Column Header **
    let headerCount = 0

    for (var f in curItem) {
      let otherField = tryGetOtherColumnForIndexPosition(headerCount)
      if (otherField) {
        let headerField = getOtherHeaderContent(otherField)
        headerCells.push(headerField)
        headerCount++
      }
      if (getShowColumn(f)) {
        let headerField = getColumnHeaderContent(f)
        headerCells.push(headerField)
        headerCount++
      }
    }

    // Other columns get what's left
    let otherHeaders = getOtherColumnsHeaders(headerCount)
    for (var i in otherHeaders) {
      let headerField = getOtherHeaderContent(otherHeaders[i])
      headerCells.push(headerField)
    }

    // Column Header **

    // Command header cell **
    if (props.commandButtons !== undefined) {
      let classes = 'header-cell '
      if (!showTitle()) {
        classes += 'last-header-cell'
      }

      let key = 'headerCell_' + elementIndex

      headerCells.push(
        <th key={key} id={key} className={classes}>
          Command
        </th>
      )
    }
    // Command header cell **

    // Value Cells
    let rows = []

    let additonnalClasses = ''
    if (props.isItemSelected) {
      if (props.isItemSelected(curItem)) {
        additonnalClasses += ' selected-row '
      }
    }

    for (var iii = 0; iii < currentDatas.length; iii++) {
      let rowCells = []
      let curRow: any = currentDatas[iii]

      if (allowEdition || (allowSelection && showCheckBoxes)) {
        let fieldValue = getSelectionEditionColumnCellContent(curRow)
        let classes = 'data-cell check-box-cell '

        if (isItemSelected(curRow)) {
          classes += ' selected-row'
        }

        if (props.getRowClass) {
          classes += ' ' + props.getRowClass(curRow) + ' '
        }

        let key = 'td_checkbox_' + iii + elementIndex

        let style = { maxWidth: '20px' }
        classes += additonnalClasses
        rowCells.push(
          <td key={key} id={key} className={classes} style={style}>
            {fieldValue}
          </td>
        )
      }

      let ii = 0
      let columnCount = 0
      let isRowSelected = isItemSelected(curRow)
      let isRowInEditMode = isItemInEditMode(curRow)
      for (var ff in curRow) {
        let otherField = tryGetOtherColumnForIndexPosition(columnCount)
        if (otherField) {
          let row = getColumnOtherColumnCellContent(
            curRow,
            columnCount,
            otherField
          )
          rowCells.push(row)

          columnCount++
        }
        // Value Cells SELECTION
        ii++
        if (getShowColumn(ff)) {
          let fieldValue = getDataCellContent(curRow, curRow[ff], ff)
          let cellRealValue = getDataCellValue(curRow, ff)
          let curCellField = ff

          let classes = getDataCellClasses(ff)

          if (isRowSelected) {
            classes += ' selected-row'
          }

          if (props.getRowClass) {
            classes += ' ' + props.getRowClass(curRow) + ' '
          }

          let key = 'td_selected_checkbox_' + elementIndex + '_' + ii * iii
          key = getUniqueElementID()

          if (isRowInEditMode && allowEdition) {
            if (props.onRowEdition) {
              rowCells.push(
                <td id={key} className={classes}>
                  <input
                    onChange={(e) => {
                      let newRow = { ...curRow }
                      newRow[curCellField] = e.target.value
                      props.onRowEdition(newRow, cellRealValue, e.target.value)
                    }}
                    type="text"
                    defaultValue={curRow[ff]}
                  ></input>
                  {fieldValue}
                </td>
              )
            }
          } else {
            if (allowSelection) {
              rowCells.push(
                <td
                  id={key}
                  onClick={(e) => onRowCellClick(e, curRow, fieldValue)}
                  className={classes}
                >
                  {fieldValue}
                </td>
              )
            } else {
              rowCells.push(
                <td id={key} className={classes}>
                  {fieldValue}
                </td>
              )
            }
          }
          columnCount++
        }
      }

      //Other columns get what's left
      let otherCells = getOtherColumnsCells(headerCount)
      let cellCount = 0
      for (var g in otherCells) {
        let cell = otherCells[g]
        let row = getColumnOtherColumnCellContent(curRow, cellCount, cell)
        rowCells.push(row)
        cellCount++
      }

      // Ajout des boutons de commande pour toutes les rangées
      let commandButtonsArray = []
      if (props.commandButtons !== undefined) {
        for (var j = 0; j < props.commandButtons.length; j++) {
          let commandButton = props.commandButtons[j]
          let key = 'dataGridCommandButton' + j * iii + elementIndex
          //key = UtilityFunctions.tryUniquifyKey(key)
          commandButtonsArray.push(
            <div
              key={key}
              id={key}
              className="command-button "
              onClick={() => commandButton.functionName(curRow)}
            >
              {commandButton.name}
            </div>
          )

          key = 'td_commandbutton_' + (j * iii + elementIndex)
          //key = UtilityFunctions.tryUniquifyKey(key)
          rowCells.push(
            <td key={key} id={key} className="last-cell">
              {commandButtonsArray}
            </td>
          )
        }
      }

      let key = 'tr_dataGridRow_' + elementIndex
      //key = UtilityFunctions.tryUniquifyKey(key)

      let row = <tr id={key}>{rowCells}</tr>

      rows.push(row)

      if (props.getSubContentFunction) {
        let selected = isItemSelected(curRow)
        let subContent = props.getSubContentFunction(curRow, selected)
        let containerClasses = selected
          ? 'sub-content-container selected-row'
          : 'sub-content-container'
        if (subContent) {
          rows.push(
            <tr className={containerClasses}>
              <div className="sub-content">{subContent}</div>
            </tr>
          )
        }
      }
    }

    if (props.getGridFooterContent) {
      let datas = { allDatas, currentDatas }
      rows.push(props.getGridFooterContent(datas))
    }

    let text = showTitle() ? props.title : ''
    if (props.showUpdateCount) {
      text += ' ' + updateCount
    }
    let gridTitle = (
      <div className="grid-title">
        {text} {collapsed}
      </div>
    )

    let gridSubtitle = <></>
    if (props.subTitle) {
      let text = props.subTitle
      gridSubtitle = <div className="grid-subtitle">{text}</div>
    }

    let globalCommandButtonsSection = globalCommandButtons ? (
      getGlobalCommandButtonsSection()
    ) : (
      <></>
    )

    let headerClasses = 'header-row '
    if (!showTitle()) {
      headerClasses += 'round-top '
    }

    let key = 'dataGridTr' + elementIndex
    //key = UtilityFunctions.tryUniquifyKey(key)
    let containerClasses =
      'grid-container ' +
      (canCollapse ? (collapsed ? ' collapse ' : ' not-collapsed ') : '')
    if (props.containerClass) containerClasses += props.containerClass

    return (
      <div ref={ref} id={elementIndex} className="grid-padding">
        <div className={containerClasses}>
          <div className="top-down-group">
            <div className="title-button-group">
              <div className="grid-title-container">
                {gridTitle}
                {gridSubtitle}
              </div>
              {getCollapseButton()}
            </div>
            {globalCommandButtonsSection}
            <table className="grid-table">
              <tbody>
                <tr key={key} id={key} className={headerClasses}>
                  {headerCells}
                </tr>
                {currentDatas.length > 0 ? rows : <></>}
              </tbody>
            </table>
          </div>
          {getPaging()}
        </div>
      </div>
    )
  }

  function getEmptyTable(loading: boolean) {
    let emptyHeaderCells = []

    let currentEmptyDatas: any = [{}]

    // Column Header **

    // Command header cell **
    if (props.commandButtons !== undefined) {
      let classes = 'header-cell '
      if (!showTitle()) {
        classes += 'last-header-cell'
      }

      let key = 'headerCell_' + elementIndex

      emptyHeaderCells.push(
        <th key={key} id={key} className={classes}>
          Command
        </th>
      )
    }
    // Command header cell **

    // Value Cells
    let rows = []

    for (var i = 0; i < currentEmptyDatas.length; i++) {
      let curEmptyItem = currentEmptyDatas[i]

      let emptyRowCells = []

      let ii = 0
      let label = loading ? 'Loading...' : 'Aucune donnée'
      let loadingIcon = loading ? <div className="lds-dual-ring"></div> : <></>
      for (var ff in curEmptyItem) {
        // Value Cells SELECTION
        ii++
        if (loading) {
          if (getShowColumn(ff)) {
            let key = 'td_selected_checkbox_' + elementIndex + '_' + ii * i
            key = getUniqueElementID()
            emptyRowCells.push(
              <td id={key} className="no-data-empty-cell">
                {loadingIcon}
              </td>
            )
          }
        } else {
          if (getShowColumn(ff)) {
            let key = 'td_selected_checkbox_' + elementIndex + '_' + ii * i
            key = getUniqueElementID()
            emptyRowCells.push(
              <td id={key} className="no-data-empty-cell">
                {label}
              </td>
            )
          }
        }
      }

      let key = 'tr_dataGridRow_' + elementIndex

      let row = <tr id={key}>{emptyRowCells}</tr>

      rows.push(row)
    }

    let text = showTitle() ? props.title : ''
    if (props.showUpdateCount) {
      text += ' ' + updateCount
    }
    let gridTitle = (
      <div className="grid-title">
        {text} {collapsed}
      </div>
    )

    let headerClasses = 'header-row '
    if (!showTitle()) {
      headerClasses += 'round-top '
    }

    let gridSubtitle = <></>
    if (props.subTitle) {
      let text = props.subTitle
      gridSubtitle = <div className="grid-subtitle">{text}</div>
    }

    let key = 'dataGridTr' + elementIndex
    let containerClasses =
      'grid-container ' + (collapsed ? ' collapse ' : ' not-collapsed ')

    return (
      <div ref={ref} className="grid-padding">
        <div className={containerClasses}>
          <div className="top-down-group">
            <div className="title-button-group">
              <div className="grid-title-container">
                {gridTitle}
                {gridSubtitle}
              </div>
              {getCollapseButton()}
            </div>
            <table className="grid-table">
              <tbody>
                <tr key={key} id={key} className={headerClasses}>
                  {emptyHeaderCells}
                </tr>
                {currentEmptyDatas.length > 0 ? rows : <></>}
              </tbody>
            </table>
          </div>
          {getPaging()}
        </div>
      </div>
    )
  }

  function getCollapseButton() {
    let symbol = collapsed ? plusSymbol : minusSymbol
    return canCollapse ? (
      <div
        id={'collapse-button'}
        className="no-border-button top-right-button"
        onClick={() => setCollapsed(!collapsed)}
      >
        {symbol}
      </div>
    ) : (
      <></>
    )
  }

  // Permet d'aller à la page du bouton cliqué dans le grid
  function setCurrentPage(page: number) {
    setCurrentPageVar(page)
  }

  // Permet d'aller à la page suivante dans le grid
  function goToNextPage() {
    setCurrentPageVar(currentPage + 1)

    setTimeout(function () {
      forceUpdateGrid()
    }, 10)
  }

  // Permet d'aller à la page précèdante dans le grid
  function goToPrevPage() {
    setCurrentPageVar(currentPage - 1)

    setTimeout(function () {
      forceUpdateGrid()
    }, 10)
  }

  function toggleSort(column: any) {
    let newDir = ''
    if (sorting.direction === 'asc') {
      newDir = 'desc'
    } else if (sorting.direction === 'desc') {
      newDir = ''
      column = ''
    } else {
      newDir = 'asc'
    }

    setSorting({
      field: column,
      direction: newDir,
    })

    forceUpdateGrid()
  }

  function isNumeric(str: any) {
    let typeOfValue = typeof str
    if (typeOfValue !== 'string') return true // we only process strings!
    return (
      !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
      !isNaN(parseFloat(str))
    ) // ...and ensure strings of whitespace fail
  }

  function isADate(date: any) {
    return (
      date &&
      Object.prototype.toString.call(date) === '[object Date]' &&
      !isNaN(date)
    )
  }

  function getPropertyPositionInUnignoredFields(field: any) {
    if (allDatas !== undefined) {
      if (allDatas[0] !== undefined) {
        let curItem = allDatas[0]
        let pos = 0
        for (var f in curItem) {
          if (field === f) {
            return pos
          }
          pos++
        }
      }
    }

    return -1
  }

  function isPropertyLastUnignoredField(field: any) {
    if (allDatas !== undefined) {
      if (allDatas[0] !== undefined) {
        let curItem = allDatas[0]
        let pos = 0
        for (var f in curItem) {
          if (field === f) {
            let keys = Object.keys(curItem)
            let nextField =
              keys[pos + 1] !== undefined ? keys[pos + 1] : undefined
            if (nextField !== undefined) {
              if (!ignoreFields.includes(keys[pos + 1])) {
                return false
              } else if (pos >= curItem.length) {
                return true
              }
            } else {
              return true
            }
          }
          pos++
        }
      }
    }

    return -1
  }

  function isItemSelected(row: any) {
    let rowDatas = getRowsDatas(row)

    if (props.isItemSelected) {
      return props.isItemSelected(row)
    }

    if (rowDatas !== undefined) {
      return rowDatas.selected
    }
    return false
  }

  function isItemInEditMode(row: any) {
    let rowDatas = getRowsDatas(row)

    if (props.isItemInEditMode) {
      return props.isItemInEditMode(row)
    }

    if (rowDatas !== undefined) {
      return rowDatas.inEditMode
    }
    return false
  }

  function getRowsDatas(row: any) {
    if (!rowsDatas || rowsDatas.length === 0 || !row) return

    if (rowsDatas.length <= 0) return

    try {
      let itemKey = row['rowID']
      let found = rowsDatas.find((element: any) => element?.rowID === itemKey)
      if (found) {
        let rowDatas = found
        return rowDatas
      } else {
        return undefined
      }
    } catch (error) {
      return undefined
    }
  }

  function onEditButtonClick(row: any) {
    if (!rowsDatas) return
    if (row) {
      if (!row['rowID']) return

      let itemKey = row['rowID']

      let rowData = rowsDatas.find((element: any) => element.rowID === itemKey)
      if (rowData) {
        rowData.inEditMode = !rowData.inEditMode
        // in rowsDatas, replace the item with the same rowID as rowData by rowData
        let index = rowsDatas.indexOf(
          rowsDatas.find((x: any) => x.rowID === rowData.rowID)
        )
        rowsDatas[index] = rowData
      } else {
        console.log('rowData not found')
      }
      setRowsData(rowsDatas)

      forceUpdateGrid()
    }
  }

  function onRowCellClick(e: any, row: any, field?: any) {
    if (!rowsDatas) return
    if (row) {
      // check if item has property of the value of primaryKey
      if (!row['rowID']) return
      let itemKey = row['rowID']

      if (props.singleRowSelection) {
        let selectedRows = rowsDatas.filter(
          (element: any) => element.selected && element['rowID'] !== itemKey
        )

        if (selectedRows)
          for (var s in selectedRows) {
            selectedRows[s].selected = false
          }
      }

      let rowData = rowsDatas.find((element: any) => element.rowID === itemKey)
      if (rowData) {
        rowData.selected = !rowData.selected
        // in rowsDatas, replace the item with the same rowID as rowData by rowData
        let index = rowsDatas.indexOf(
          rowsDatas.find((x: any) => x.rowID === rowData.rowID)
        )
        rowsDatas[index] = rowData
      } else {
        console.log('rowData not found')
      }
      setRowsData(rowsDatas)

      forceUpdateGrid()

      // if e.detail is 1,2 or 3
      if (e.detail === 1 || e.detail === 2 || e.detail === 3) {
        clearTimeout(clickTimeout)
      }

      switch (e.detail) {
        case 1:
          clickTimeout = setTimeout(() => {
            if (props.onRowSelection) {
              props.onRowSelection(row)
            }
            if (props.onRowCellClick) {
              props.onRowCellClick(row, field)
            }
          }, 50)
          break
        case 2:
          clickTimeout = setTimeout(() => {
            if (props.onRowCellDoubleClick) {
              props.onRowCellDoubleClick(row, field)
            }
          }, 50)
          break
        case 3:
          clickTimeout = setTimeout(() => {
            if (props.onRowCellTripleClick) {
              props.onRowCellTripleClick(row, field)
            }
          }, 50)
          break
      }
    }
  }

  function getAllowSorting(field: any) {
    if (columns[field] !== undefined) {
      if (columns[field].allowSorting) {
        return true
      } else {
        if (columnsOptions?.allowAllSorting) {
          if (columnsOptions.allowAllSorting) {
            return true
          }
        }
        return false
      }
    }

    if (columnsOptions?.allowAllSorting) {
      if (columnsOptions.allowAllSorting) {
        return true
      }
    }

    return false
  }

  function getShowColumn(column: any) {
    if (!columns || columns.length === 0 || !column) return false

    // check if columns has a property of column
    if (!columns.hasOwnProperty(column)) return false

    if (getHideColumn(column)) {
      return false
    }

    if (columns[column] || columnsOptions?.all !== undefined) {
      return true
    }
    return false
  }

  function getHideColumn(column: any) {
    if (hideColumns !== undefined) {
      if (hideColumns[column] !== undefined) {
        return true
      }
    }

    return false
  }

  function getHeaderCellClasses(field: any) {
    let classes = ' header-cell '
    if (getPropertyPositionInUnignoredFields(field) === 0) {
      if (!showTitle()) classes += ' first-header-cell '
    } else if (isPropertyLastUnignoredField(field)) {
      if (props.commandButtons !== undefined) {
      } else {
        if (!showTitle()) classes += ' last-header-cell '
      }
    }

    if (getShowColumn(field)) {
      if (getAllowSorting(field)) {
        classes += 'clickable-th '
      }
    }

    return classes
  }

  function getGlobalCommandButtonsSection() {
    let buttons = []
    let i = 0
    for (var b in globalCommandButtons) {
      let curButton = globalCommandButtons[b]
      let returnValue =
        curButton.returnType === 'selected' ? getSelectedRowsDatas() : undefined

      let key = 'dataGridGlobalButtons_' + i + elementIndex
      //key = UtilityFunctions.tryUniquifyKey(key)
      let enabled = globalCommandButtons[b].getIsEnabledFunction
        ? globalCommandButtons[b].getIsEnabledFunction(returnValue)
        : true
      let button = enabled ? (
        <div
          key={key}
          id={key}
          className="command-button"
          onClick={() => curButton.onClick(returnValue)}
        >
          {curButton.buttonText}
        </div>
      ) : (
        <div
          key={key}
          id={key}
          className="disabled-command-button command-button"
        >
          {curButton.buttonText}
        </div>
      )
      buttons.push(button)
      i++
    }

    return <div className="global-command-buttons-section">{buttons}</div>
  }

  function getSelectedRowsDatas() {
    if (!rowsDatas || rowsDatas?.length <= 0) return
    let selectedRows = rowsDatas?.filter((x: any) => x?.selected)
    let datas: any = []

    for (var f in selectedRows) {
      for (var i in selectedRows[f]) {
        if (i === 'datas') {
          datas.push(selectedRows[f][i])
        }
      }
    }

    if (datas.length <= 0) datas = undefined

    return datas
  }

  function getSelectionHeaderCellContent() {
    let key = 'dataGridSelectionHeaderCellContainer' + elementIndex
    //key = UtilityFunctions.tryUniquifyKey(key)

    return (
      <th key={key} id={key} className="header-cell selection-header">
        <div></div>
      </th>
    )
  }

  function getSelectionEditionColumnCellContent(item: any) {
    if (rowsDatas !== undefined) {
      let content = []
      let selected = isItemSelected(item)
      if (allowSelection && showCheckBoxes)
        content.push(
          <input
            type="checkbox"
            onChange={() => onRowCellClick(1, item)}
            checked={selected}
          ></input>
        )
      if (allowEdition) {
        let inEditMode = isItemInEditMode(item)
        content.push(
          <button
            className="action-button"
            onClick={() => onEditButtonClick(item)}
          >
            {inEditMode ? 'Terminer' : 'Modifier'}
          </button>
        )
      }

      return content
    } else {
      return (
        <input
          type="checkbox"
          onChange={() => onRowCellClick(1, item)}
          checked={false}
        ></input>
      )
    }
  }

  function getSortingIconForColumn(column: any) {
    if (!currentDatas) return ''
    if (sorting.field === column) {
      return sorting.direction === 'asc' ? ascSymbol : descSymbol
    } else {
      return ''
    }
  }

  function getColumnHeaderLabel(field: any) {
    return props?.columns[field]?.label
      ? props.columns[field].label
      : field.charAt(0).toUpperCase() + field.slice(1)
  }

  function tryGetOtherColumnForIndexPosition(i: any) {
    if (otherColumns) {
      for (var f in otherColumns) {
        let field = otherColumns[f]
        if (field.index === i) {
          return field
        }
      }
    }
    return undefined
  }

  function getOtherColumnsHeaders(from: any) {
    let r = []

    for (var f in otherColumns) {
      let field = otherColumns[f]
      if (field.index > from) {
        r.push(field)
      }
    }

    return r
  }

  function getOtherColumnsCells(from: any) {
    let r = []

    for (var f in otherColumns) {
      let field = otherColumns[f]
      if (field.index > from) {
        r.push(field)
      }
    }

    return r
  }

  // Other columns ***************************
  function getOtherHeaderContent(f: any) {
    let headerContent: any = (
      <div className="top-down-group">
        <div>{f.label}</div>
        {f.headerContent}
        <></>
      </div>
    )

    let hideHeader = false
    let columnFieldDatas = otherColumns[f]
    if (columnFieldDatas?.hideHeader) {
      hideHeader = true
    } else if (columnsOptions?.hideColumnHeaders) {
      hideHeader = true
    }
    let classes = 'header-cell '
    if (hideHeader) {
      classes += ' hidden-header-cell'
      headerContent = <></>
    }

    let style = {
      maxWidth: otherColumns[f]?.maxWidth
        ? otherColumns[f]?.maxWidth
        : 'inherit',
    }

    let key = 'dataGridHeaderField_' + f.index + f.label + elementIndex

    let headerField = (
      <th
        key={key}
        id={key}
        className={classes}
        style={style}
        onClick={() => getHeaderCellOnClick(f)}
      >
        {headerContent}
      </th>
    )

    return headerField
  }

  function getColumnOtherColumnCellContent(
    curItem: any,
    count: number,
    field: any
  ) {
    let fieldValue = field.getContentFunction
      ? field.getContentFunction(curItem)
      : field.content
      ? field.content
      : field.getValueFunction
      ? field.getValueFunction(curItem)
      : 'NO VALUE'

    let classes = ' data-cell '
    if (isItemSelected(curItem)) {
      classes += ' selected-row'
    }

    if (props.getRowClass) {
      classes += ' ' + props.getRowClass(curItem) + ' '
    }

    let key = 'td_otherColumnDataCell_' + count + elementIndex

    let style = field.maxWidth ? { maxWidth: '20px' } : {}

    return (
      <td key={key} id={key} className={classes} style={style}>
        {fieldValue}
      </td>
    )
  }
  // Other columns UP ***************************

  function getColumnHeaderContent(field: any) {
    let columnName = field

    columnName =
      getColumnHeaderLabel(field) + ' ' + getSortingIconForColumn(field)

    let classes = getHeaderCellClasses(field)

    let headerFieldContent = columnName

    if (currentDatas) {
      headerFieldContent = (
        <div className="top-down-group">
          <div onClick={() => getHeaderCellOnClick(field)}>{columnName}</div>
          {getAllowSearchForColumn(field) ? (
            <input
              placeholder="Rechercher.."
              onChange={(x) => updateSearchField(field, x.target.value)}
              className="column-search"
            ></input>
          ) : (
            <></>
          )}
        </div>
      )
    } else {
      headerFieldContent = (
        <div className="top-down-group">
          <div>{columnName}</div>
        </div>
      )
    }

    let key = 'dataGridHeaderField_' + field + elementIndex
    //key = UtilityFunctions.tryUniquifyKey(key)

    let style = {
      maxWidth: columns[field]?.maxWidth ? columns[field]?.maxWidth : 'inherit',
    }

    let hideHeader = false
    let columnFieldDatas = columns[field]
    if (columnFieldDatas?.hideHeader) {
      hideHeader = true
    } else if (columnsOptions?.hideColumnHeaders) {
      hideHeader = true
    }
    if (hideHeader) {
      classes += ' hidden-header-cell'
      headerFieldContent = ''
    }

    let cellField = (
      <th key={key} id={key} className={classes} style={style}>
        {headerFieldContent}
      </th>
    )

    return cellField
  }

  function getAllowSearchForColumn(field: any) {
    let allowAllSearch = columns?.allowAllSearch

    let allowColumnSearch = columns[field]
      ? columns[field].allowSearch !== undefined
        ? columns[field].allowSearch
        : allowAllSearch
      : allowAllSearch

    if (allowColumnSearch) {
      return true
    } else {
      return false
    }
  }

  function getDataCellContent(currentRow: any, value: any, field: any) {
    if (value === undefined || value === null) {
      value = ''
    }
    let result = value.toString()

    let column = columns[field]
    if (column !== undefined) {
      if (column.getContentFunction) {
        let value = column.getContentFunction(currentRow)
        return value
      } else if (column.getValueFunction) {
        let formattedValue = column.getValueFunction(currentRow, value)

        if (formattedValue !== undefined) {
          result = formattedValue.toString()

          return result
        }
      }
    }

    if (isADate(value)) {
      result = new Date(value).toString()
    }

    return result
  }

  function getDataCellValue(currentRow: any, field: any) {
    return currentRow[field]
  }

  function getDataCellClasses(column: any) {
    let classes = 'data-cell'

    // We get position of the current field
    let columnPos = -1
    let i = 0

    if (columnsOptions?.all) {
      for (var o in allDatas[0]) {
        if (o === column) {
          columnPos = i
        }
        if (!getHideColumn(o)) {
          i++
        }
      }
    } else {
      for (var oo in columns) {
        if (oo === column) {
          columnPos = i
        }
        i++
      }
    }

    // We get the field count
    let fieldCount = 0
    if (columnsOptions?.all) {
      let curItem = allDatas[0]

      if (curItem)
        if (Object.keys(curItem).length > 0) {
          fieldCount = Object.keys(curItem).length

          if (hideColumns !== undefined) {
            fieldCount -= Object.keys(hideColumns).length
          }
        }
    } else {
      if (columns !== undefined) {
        if (Object.keys(columns).length > 0) {
          fieldCount = Object.keys(columns).length
        }
      }
    }

    if (props.commandButtons !== undefined) {
      fieldCount++
    }

    if (columnPos <= 0) {
      classes += ' first-cell'
    } else if (columnPos >= fieldCount - 1) {
      classes += ' last-cell'
    }

    return classes
  }

  function getHeaderCellOnClick(column: any) {
    let showColumn = getShowColumn(column)
    let allowAllSorting = getAllowSorting(column)
    if (showColumn) {
      if (allowAllSorting) {
        toggleSort(column)
      }
    }
  }

  function getEmptyData() {
    let emptyItem = {}
    if (columns !== undefined) {
      for (var f in columns) {
        if (hideColumns && hideColumns[f]) {
        } else {
          emptyItem[f] = ''
        }
      }
    }

    return undefined
  }

  function getFilteredDatasForSearchParams(data?: any) {
    let fields = {}
    let result = true

    if (searchParams !== undefined) {
      if (data) {
        for (var f in data) {
          if (searchParams[f] !== undefined && searchParams[f] !== '') {
            fields[f] = ''
          }
        }
      } else {
        for (var f in allDatas) {
          if (searchParams[f] !== undefined && searchParams[f] !== '') {
            fields[f] = ''
          }
        }
      }

      if (Object.keys(fields).length > 0) {
        for (var ff in fields) {
          let dataVal = data[ff]?.toString()?.toLowerCase()
          let searchVal = searchParams[ff]?.toString()?.toLowerCase()
          if (dataVal?.includes(searchVal)) {
          } else {
            result = false
          }
        }
      }
    }

    return result
  }

  function updateSearchField(fieldKey: any, value: any) {
    searchParams[fieldKey] = value

    setSearchParams(searchParams)
    updateCurrentDatas()
  }
}

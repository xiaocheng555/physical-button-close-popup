import { useRoute, useRouter } from 'vue-router'

let popupKeyPrev = 'p_'

export default function useHistoryPopup () {
  const router = useRouter()
  const route = useRoute()
  
  function setPopupKeyPrev (val: string) {
    popupKeyPrev = val
  }
  
  // whenNoBack：没有返回页时才关闭弹窗
  async function closeHistoryPopups (whenNoBack = true) {
    if (window.history.state?.popupKey && whenNoBack) {
      return
    }
    
    if (window.history.state?.popupKey) {
      const query = route.query
      let count = 0
      for (let key in query) {
        if (key.startsWith(popupKeyPrev)) {
          count++
        }
      }
      count > 0 && router.go(-count)
    } else {
      const newQuery = { ... route.query}
      for (let key in newQuery) {
        if (key.startsWith(popupKeyPrev)) {
          delete newQuery[key]
        }
      }
      await router.replace({
        query: newQuery
      })
    }
  }
  
  return {
    popupKeyPrev,
    setPopupKeyPrev,
    closeHistoryPopups
  }
}
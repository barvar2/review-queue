import locale from 'element-ui/lib/locale'
import en from 'element-ui/lib/locale/lang/en'
import Alert from 'element-ui/lib/alert'
import Button from 'element-ui/lib/button'
import Card from 'element-ui/lib/card'
import Checkbox from 'element-ui/lib/checkbox'
import Descriptions from 'element-ui/lib/descriptions'
import DescriptionsItem from 'element-ui/lib/descriptions-item'
import Empty from 'element-ui/lib/empty'
import Form from 'element-ui/lib/form'
import FormItem from 'element-ui/lib/form-item'
import Input from 'element-ui/lib/input'
import Loading from 'element-ui/lib/loading'
import Message from 'element-ui/lib/message'
import Option from 'element-ui/lib/option'
import Select from 'element-ui/lib/select'
import Skeleton from 'element-ui/lib/skeleton'
import SkeletonItem from 'element-ui/lib/skeleton-item'
import TabPane from 'element-ui/lib/tab-pane'
import Tabs from 'element-ui/lib/tabs'
import Tag from 'element-ui/lib/tag'
import Tooltip from 'element-ui/lib/tooltip'
import '../styles/element-theme.scss'

const components = [
  Alert, Button, Card, Checkbox, Descriptions, DescriptionsItem, Empty, Form, FormItem,
  Input, Option, Select, Skeleton, SkeletonItem, TabPane, Tabs, Tag, Tooltip
]

export default {
  install(Vue) {
    locale.use(en)
    components.forEach(component => Vue.use(component))
    Vue.use(Loading.directive)
    Vue.prototype.$message = Message
  }
}

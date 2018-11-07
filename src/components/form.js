import _ from 'lodash'
import React from 'react'
import { Form } from 'antd'

const DECORATOR_OPTIONS = [
    'getValueFromEvent',
    'initialValue',
    'normalize',
    'rules',
    'trigger',
    'validateFirst',
    'validateTrigger',
    'valuePropName',
]

const FORM_ITEM_PROPS = [
    'colon',
    'extra',
    'hasFeedback',
    'help',
    'label',
    'labelCol',
    'required',
    'validateStatus',
    'wrapperCol',
]

const DEFAULT_LABEL_COL = {
    span: 4,
    offset: 1,
}

const DEFAULT_WRAPPER_COL = {
    span: 16,
    offset: 1,
}

function collectFields(fields, target) {
  return _.reduce(fields, (acc, field) => {
      if (_.has(target, field)) {
          acc[field] = target[field]
      }
      return acc
  }, {})
}

export default function create(options, collectFormItem) {
    if (_.isFunction(options)) {
        collectFormItem = options
        options = {}
    }

    class EnhanceForm extends React.PureComponent {
        render() {
            const propsForm = { ...this.props.form }
            const formData = collectFormItem(propsForm, this)
            let formItems = []
            let formProps = {}
            if (_.has(formData, 'formItems') && _.has(formData, 'formProps')) {
                formItems = formData.formItems
                formProps = formData.formProps
            } else {
                formItems = formData
                formProps = null
            }
            if (_.isFunction(formItems)) {
                formItems = formItems(propsForm)
            }
            if (!_.isArray(formItems)) {
                formItems = [formItems]
            }
            formItems = _.map(formItems, item => {
                if (_.isFunction(item)) {
                    return item(propsForm, this)
                }
                if (!_.has(item, 'key')) {
                    throw Error('item.key is required')
                }
                let component
                if (_.isFunction(item.component)) {
                    component = item.component(propsForm)
                } else {
                    component = item.component
                }
                // 每次渲染均需要做fieldDecorator，
                // 否则将无法自动完成受控过程，
                // 也拿不到field的值
                let decoratorOptions = {}
                if (_.has(item, 'decoratorOptions')) {
                    decoratorOptions = item.decoratorOptions
                } else {
                    decoratorOptions = collectFields(DECORATOR_OPTIONS, item)
                }
                if (item.unSetFieldDecorator !== true) {
                    const wrap = propsForm.getFieldDecorator(item.key, decoratorOptions)
                    component = wrap(component)
                }
                let itemProps = {}
                if (_.has(item, 'itemProps')) {
                    itemProps = item.itemProps
                } else {
                    itemProps = collectFields(FORM_ITEM_PROPS, item)
                }
                if (!_.has(itemProps, 'labelCol')) {
                    itemProps.labelCol = { ...DEFAULT_LABEL_COL }
                }
                if (!_.has(itemProps, 'wrapperCol')) {
                    itemProps.wrapperCol = { ...DEFAULT_WRAPPER_COL }
                }
                return <Form.Item key={ item.key } { ...itemProps } >
                    { component }
                </Form.Item>
            })
            if (formProps || formData.wrapForm) {
                return <Form { ...formProps }>
                    { formItems }
                </Form>
            } else {
                return formItems
            }
        }
    }

    const generate = Form.create(options)
    return generate(EnhanceForm)
}

import { baseType, ObjectOrType, Type }  from '@itrocks/class-type'
import { decorateCallback, decoratorOf } from '@itrocks/decorator/class'

const STORE = Symbol('store')

type Dependencies = {
	setTransformers?: (target: Type) => void
	toStoreName:      (className: string) => string
}

const depends: Dependencies = {
	toStoreName: targetName => targetName
}

export function setStoreDependencies(dependencies: Partial<Dependencies>)
{
	Object.assign(depends, dependencies)
}

export default Store
export function Store(name: string | false = '')
{
	return decorateCallback(STORE, function(target) {
		if ((name !== false) && depends.setTransformers) {
			depends.setTransformers(target)
		}
		if (name !== '') {
			return name
		}
		return depends.toStoreName(baseType(target).name)
	})
}

export function storeOf(target: ObjectOrType)
{
	return decoratorOf<string | false>(target, STORE, false)
}

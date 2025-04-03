export enum ConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUALS = 'GREATER_THAN_OR_EQUALS',
  LESS_THAN_OR_EQUALS = 'LESS_THAN_OR_EQUALS',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
  IS_EMPTY = 'IS_EMPTY',
  IS_NOT_EMPTY = 'IS_NOT_EMPTY'
}

export interface Condition {
  id: string;
  targetingRuleId: string;
  attribute: string;
  operator: ConditionOperator;
  value: any;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CreateConditionDto {
  attribute: string;
  operator: ConditionOperator;
  value: any;
}

export interface UpdateConditionDto {
  attribute?: string;
  operator?: ConditionOperator;
  value?: any;
} 
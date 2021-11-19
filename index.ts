//Prototype
interface Array<T>
{
    filter_by(item:T):Array<T>;
    filter_by_index(item:Index):Array<T>;
    print_all():void;
}
Array.prototype.filter_by = function<T>(item:T):Array<T>
{
    return this.filter(it=>it === item);
}
Array.prototype.filter_by_index = function<T>(index:Index):Array<T>
{
    return this.filter((_,ind)=> ind === index);
}
Array.prototype.print_all = function():void
{
    this.forEach(t=>console.log(t));
}
type Index = number;
//Token
const TERMINAL :0 = 0;
const NON_TERMINAL :1 = 1;

type TokenType = (typeof TERMINAL) | (typeof NON_TERMINAL);
interface IToken
{
    type:TokenType;
    value:string;
}
class Token implements IToken
{
    constructor(public type: TokenType,public value: string)
    {}
    public static Terminal(value: string):IToken{
        return new Token(TERMINAL,value);
    }

    public static NonTerminal(value: string):IToken{
        return new Token(NON_TERMINAL,value);
    }
    public static Variable(value: string) : TokenVariable{
        return new Token(NON_TERMINAL,value) as TokenVariable;
    }
}
type TokenVariable = IToken & {type : (typeof NON_TERMINAL)}
type TokenTerminal = IToken & {type : (typeof TERMINAL)}
//DFA
type ConnectState = {
    origin :number,
    target :number,
    token :Token,
};
interface IDfa<T> 
{
    states:T[];
    connects:ConnectState[];
    add_state(state:T):number;
    index_state(state:T):number;
    rm_state(state:T):void;
    rm_state_by_index(index:Index):T | undefined;
    connect(origin :number,target :number,token :IToken):void;
    disconnect(origin :number,target :number,token :IToken):ConnectState | null;
}
interface ISimilar<T>
{
    is_similar(state:T):boolean;
}

class DFA<T extends ISimilar<T>> implements IDfa<T>
{
    states: T[];
    connects: ConnectState[];
    constructor()
    {
        this.states=[];
        this.connects=[];
    }
    index_state(state:T):number
    {
        for (let index = 0;index < this.states.length;index++) 
            if(this.states[index].is_similar(state))
                return index;
        return -1;
    }
    add_state(state:T):number
    {
        let index = this.index_state(state);
        
        if(index >= 0) return index;

        this.states.push(state); 
        
        return this.states.length - 1;
    }
    rm_state(state:T):void
    {
        this.states = this.states.filter(s=> s === state);
    }
    rm_state_by_index(index:Index):T | undefined
    {
        const state = this.states.find((_,i)=>i === index);
        
        if(state)
            this.states = this.states.filter(s=> s === state);
        
        return state;
    }
    connect(origin :number,target :number,token :IToken):void
    {
        for (const cnn of this.connects) 
            if(
                cnn.origin === origin &&
                cnn.target === target && 
                cnn.token  === token
            ) return;
        
        const con : ConnectState = { origin,target,token };
        this.connects.push(con);  
    }   
    disconnect(origin :number,target :number,token :IToken):ConnectState | null
    {
        const index = this.connects.findIndex( cnn=>(
            cnn.origin === origin &&
            cnn.target === target && 
            cnn.token  === token
        ));
            
        if(index == -1) return null;

        const data = this.connects[index];
        
        this.connects = this.connects.filter(cn=>cn === data);
        
        return data;
    }  
}
//Gramer
type Rule =
{
    state:TokenVariable,
    tokens:Token[]
}
interface IGramer
{
    vars:TokenVariable[];
    terminals:IToken[];
    title?:string;
    rules:Rule[];
    add_rule(state:TokenVariable,...tokens:(IToken | TokenVariable)[]):boolean;
    rm_rule(index:Index):Rule;
    concat_rules(rules:Rule[]):number;
    print():void;
}
class Gramer implements IGramer
{
    rules: Rule[];
    constructor(public vars: TokenVariable[],public terminals: IToken[],public title?: string)
    {
        this.rules = [];
    }
    add_rule(state: TokenVariable, ...tokens: IToken[]): boolean 
    {
        for (const rul of this.rules) {
            if(rul.state.value !== state.value) continue;
            
            if(rul.tokens.length !== tokens.length) continue;

            for (let i = 0; i < rul.tokens.length; i++) 
                if(
                    tokens[i].type === rul.tokens[i].type &&
                    tokens[i].value === rul.tokens[i].value
                ) return false;
        }

        const rule :Rule = {state,tokens};  

        this.rules.push(rule);

        return true;
    }
    rm_rule(index: number): Rule
    {
        if(index < 0 || index >= this.rules.length)
            throw new Error("Out Of Bound Array");
        
        const rule = this.rules[index];

        this.rules = this.rules.filter(rul=>rul === rule); 

        return rule;
    }
    concat_rules(rules: Rule[]): number
    {
        let count = 0;
        for (const rul of rules) {
            let added = this.add_rule(rul.state,...rul.tokens);
            if(added) count++;
        }
        return count;
    }
    print():void
    {
        let str_gram :string[]= [];
        for (let i=0;i<this.rules.length;i++) {
            let line = `${i} : `;
            line += `${this.rules[i].state.value} -> `;
            if(this.rules[i].tokens.length === 0)
                line += "ε"; 
            else
                line += this.rules[i].tokens.map(tk=>tk.value).join(" ");

            str_gram.push(line);
        }
        console.log(`Gramer : ${this.title}`);
        str_gram.print_all();
    }
    public static is_ambiguous(rules: Rule[])   : boolean{return false;}

    public static rslv_ambiguous(rules: Rule[])   : Rule[]{return []}
    
    public static left_factoring(rules: Rule[]) : Rule[]{return []}
    
    public static left_recursion(rules: Rule[]) : Rule[]{return []}
}

type Item = 
{
    dot_pos:number,
    rule_number:number
};
interface ISet<T>
{
    items:T[]
    add_item(item:T):void;
    rm_item(index:Index):T;
    concat(set:ISet<T>):void;
}
class ItemSet implements ISet<Item>,ISimilar<ItemSet>
{
    items: Item[];
    constructor()
    {
        this.items=[];
    }
    concat(set: ISet<Item>): void {
        for (const item of set.items) 
            this.add_item(item)
    }
    is_similar(state: ItemSet): boolean {
        if(this.items.length !== state.items.length) return false;

        for (const sit of state.items) 
            if(this.exsist(sit) === false) return false;
            
        return true;
    }
    exsist(item: Item): boolean
    {
        for (const it of this.items) 
        if(it.dot_pos == item.dot_pos && it.rule_number == item.rule_number)
            return true;
        
        return false;
    }
    add_item(item: Item): boolean {
        if(this.exsist(item)) return false;

        this.items.push(item);
        
        return true;
    }
    rm_item(index: number): Item {
        if(index < 0 || index >= this.items.length)
            throw new Error("Out of Bound");
        
        const data = this.items[index];

        this.items = this.items.filter_by_index(index);

        return data;
    }
    
}
enum Command {
    SHIFT="S",
    REDUCE="R",
    GO="G"
}
type CommandTableType = {
    type  : Command,
    index : Index
}
type CT = CommandTableType | CommandTableType[] | undefined;
interface RowLR
{
    terminals:CT[],
    vars:CT[],
}
interface ColLR
{
    terminals:TokenTerminal[],
    vars:TokenVariable[],
}
interface ITableLR
{
    cols:ColLR;
    rows:RowLR[];
    add_cmd(dfa_state:Index,token:IToken,cmdtbla:CommandTableType):void;
    print(): void;
}
class TableLR implements ITableLR
{
    rows: RowLR[];
    
    constructor(size:number,public cols: ColLR)
    {
        this.rows = []
        for (let i = 0; i < size; i++) 
            this.rows.push({
                terminals:new Array(this.cols.terminals.length),
                vars:new Array(this.cols.vars.length),
            })
    }
    add_cmd(dfa_state:Index,token:IToken,cmdtbla:CommandTableType)
    {
        const cols = token.type === NON_TERMINAL ? this.cols.vars : this.cols.terminals;
        const row =  token.type === NON_TERMINAL ? this.rows[dfa_state].vars : this.rows[dfa_state].terminals;
        const index = cols.findIndex(v=> v.value === token.value);
        //
        let data : CT = row[index]; 

        if(data instanceof Array) data = [...data,cmdtbla];
        
        else if(data === undefined)data = cmdtbla;
        
        else data = [data,cmdtbla];
        
        row[index] = data;

    }
    rm_cmd(){}
    
    ad_row(){}
    
    rm_row(){}

    print(title:string ="Table LR0"): void{
        const columns = ["state",...this.cols.terminals.map(x=>x.value),...this.cols.vars.map(x=>x.value)];
        let r:CT[][] | string[][] = [];
        for (let i = 0; i < this.rows.length; i++) 
            r[i] = [...this.rows[i].terminals,...this.rows[i].vars];
        for (let i = 0; i < this.rows.length; i++) 
        {
            for (let j = 0; j < r[i].length; j++) {

                let itm : CT = r[i][j] as CT;
                let val:string="";
                if(itm === undefined)  val ="-";
                else if(itm instanceof Array)  val = itm.join(" ");
                else val = itm.type + itm.index;
                
                r[i][j] = val;
            }
        }
        let data : any [] = [];
        for (let i = 0; i < r.length; i++) 
        {
            let obj = { state : i };
            for (let j = 0; j < r[i].length; j++) 
                obj = Object.assign(obj,{ [columns[j+1]] : r[i][j] });
            
            data.push(obj);
        }
        console.log(title);
        console.table(data,columns);
    }
}

interface ILR
{
    grm:Gramer;
    dfa:DFA<ItemSet>;
    init():void;
    goto(set:ItemSet,token:IToken):ItemSet;
    clousre(set:ItemSet):ItemSet;
    table():ITableLR
} 
class LR implements ILR
{
    dfa: DFA<ItemSet>;
    
    constructor(public grm: Gramer)
    {
        this.dfa = new DFA();  
    }
    init():void
    {
        if(this.grm.rules.length == 0) return;
        
        const init_set = new ItemSet(); 
        init_set.add_item({rule_number:0,dot_pos:0});

        let current = 0;
        const Ilist :ItemSet[] = [];
        const I0 = this.clousre(init_set);
        this.dfa.add_state(I0);
        Ilist.push(I0);
        do
        {
            //get current I in list of stack In 
            let Icurrent = Ilist[current];
            //get current index in dfa state
            let current_index = this.dfa.index_state(Icurrent);
            for (const {dot_pos,rule_number} of Icurrent.items) 
            {
                const tokens = this.grm.rules[rule_number].tokens;
                if(tokens.length <= dot_pos) continue;
                const token : Token = tokens[dot_pos];
                let Inext = this.clousre(this.goto(Icurrent,token));
                let next_index = this.dfa.add_state(Inext);
                if(next_index > current)
                    Ilist.push(Inext);
                this.dfa.connect(current_index,next_index,token);

            }
            current++;
        } while(current < Ilist.length);

    }
    goto(set: ItemSet,token:IToken): ItemSet {
        const res = new ItemSet();
        
        for (const {dot_pos,rule_number} of set.items) 
        {   
            const toks = this.grm.rules[rule_number].tokens;
            
            if(toks.length <= dot_pos) continue;
            
            if(toks[dot_pos].value != token.value)  continue;
          
            const item : Item = {rule_number,dot_pos:dot_pos+1}; 

            res.add_item(item);
        }
        return res;
    }
    clousre(set: ItemSet): ItemSet {
        const res = new ItemSet();
        res.concat(set);
        for (const {dot_pos,rule_number}  of res.items) {

            const toks = this.grm.rules[rule_number].tokens;

            if(toks.length <= dot_pos) continue;

            if(toks[dot_pos].type === TERMINAL) continue;

            for (let i=0; i < this.grm.rules.length ;i++) {
                const {state,tokens:tks} = this.grm.rules[i];
                
                if(state.value !== toks[dot_pos].value) continue;
                
                const item : Item = {rule_number:i,dot_pos:0}; 
                
                res.add_item(item);

            }
        }
        return res;
    }
    table(): ITableLR {
        const rules = this.grm.rules;
        const columns :ColLR = {
            terminals:this.grm.terminals as TokenTerminal[],
            vars:this.grm.vars
        };
        const tbl : ITableLR = new TableLR(this.dfa.states.length,columns);

        for (let i=0; i < this.dfa.connects.length;i++) {
            const conn = this.dfa.connects[i];
            const command : Command = conn.token.type === TERMINAL 
            ? Command.SHIFT
            : Command.GO;
            const cmdtbl : CommandTableType = {
                index:conn.target,
                type:command
            }
            tbl.add_cmd(conn.origin,conn.token,cmdtbl);
        }
        for (let i = 0;i < this.dfa.states.length; i++) {
            const item_set = this.dfa.states[i];
            for (const {dot_pos,rule_number} of item_set.items) {
                const toks = rules[rule_number].tokens;
                //this is not last item dot
                if(toks.length > dot_pos) continue;

                const cmdtbl : CommandTableType = {
                    index:rule_number,
                    type:Command.REDUCE
                };
                
                this.grm.terminals.forEach(t=>tbl.add_cmd(i,t,cmdtbl));
            }
        }
        return tbl;
    }

}
const init_gramer = () : IGramer =>{
    //State
    const S_ : TokenVariable = Token.Variable("S'");
    const S : TokenVariable = Token.Variable("S");
    const L : TokenVariable = Token.Variable("L");
    const vars = [S_,S,L];
    //Token
    const x : IToken = Token.Terminal("x");
    const cma : IToken = Token.Terminal(",");
    const pl : IToken = Token.Terminal("(");
    const pr : IToken = Token.Terminal(")");
    const doler : IToken = Token.Terminal("$");
    const terminals = [doler,pl,pr,x,cma];
    
    //create own gramer 
    const gm :IGramer = new Gramer(vars,terminals,"test");
    
    gm.add_rule(S_,S,doler);
    gm.add_rule(S,pl,L,pr);
    gm.add_rule(S,x);
    gm.add_rule(L,S);
    gm.add_rule(L,L,cma,S);

    return gm;
};
const main = () : void => {
    const gm = init_gramer();
    gm.print();
    //instanc LR 
    const lr0 :ILR = new LR(gm);
    lr0.init();
    // lr0.dfa.states.map((x,i)=>console.log(i,x.items));
    const tbl = lr0.table();
    tbl.print();
};

main();
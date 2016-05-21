---
title: C#中的自增、自减操作符重载是个怎么回事儿
author: Roy Cheng
date: 2011-05-21 13:53
template: article.jade
---

在C#中，重载自增、自减操作符的语法并没有什么特殊之处：

``` C++
public static SomeType operator ++(SomeType some)
{
    // 具体实现
}
```

C#中的自增、自减操作符重载，无论前缀式或是后缀式，都统统只需要一个实现。那么问题来了——前缀式++与后缀式++的行为毕竟不同，为什么它们 共用同一份代码呢？

<span class="more"></span>

首先必须明确一点，重载操作符的第一原则就是不应该改变操作数对象，而应该返回一个新的对象。否则不仅很可能会令那些使用我们的重载操作符的客户产生困惑，而且更有可能会在调试代码的时候出现意想不到的情况。那么对于自增和自减操作符，我们是否也需要遵从此原则呢？我们又怎么能在不修改操作数的情况下，对操作数自增或者自减呢？考虑如下的实现：   

``` C++
class SomeType   
{     
    public int Number { get; set; }
    public static SomeType operator ++(SomeType s)     
    {        
        s.Number++;        
        return s;     
    }
}
```

这里直接修改了操作数，并且直接返回了修改之后的操作数实例。

当我们使用SomeType的前缀自增重载时：

``` C++
SomeType instance = new SomeType();
instance.Number = 1;
++instance;
```

如我们所预料的，操作符重载的方法体会被执行。而且instance也确实会按照理想的方式自增。我们再来看后缀自增操作：

``` C++
SomeType instance1 = new SomeType();
instance1.Number = 1;
SomeType instance2 = instance1++；
```

乍一看，貌似instance1的Number应该是2，而instance2的Number应该是1。但是，事不如人愿，实际上现在的instance1和instance2的Number都是2！

这到底是为什么呢？

其实是这样的，相比其他我们司空见惯的重载操作符如+和-，编译器会对重载的自增和自减操作符做一些额外的处理。在我们使用自增重载的时候，如++instance，++重载的方法体会被执行。然而我们没有想到的是，在操作符重载方法被执行完成之后，instance会被自动赋值为操作符重载方法的返回值！而这一切都是编译的时候就安排好了的。也就是说，如果SomeType是引用类型，则在执行完++instance语句之后，instatnce会指向那个被自增重载操作符方法所返回的对象实例。而如果SomeType是值类型，那么instance会被按照C#值类型的标准赋值方式被重载操作符方法返回的值类型赋值，也就是逐字段赋值。

当我们使用前缀式时，这一切都工作的很好。但是当我们使用后缀式时，问题就来了。在上面的使用后缀自增的例子里，首先执行了instance1的自增操作，不过接下来，实际上是使用了instance1在执行自增操作前的一个副本（对于引用类型，使用引用的副本；对于值类型，使用整个结构的副本）来对instance2赋值的。因为我们在SomeType的自增重载的实现中，直接对操作数进行了修改，并且返回了原操作数。所以这样一来，现在instance1和instance2现在指向的都是原操作数的实例，他们有同样的Number也就不足为怪了。

另一个SomeType的自增重载版本是这样的：     


``` C++
public static SomeType operator ++(SomeType s)     
{         
    var result =  new SomeType();         
    result.Number++;         
    return result;     
}
``` 

这个版本的实现遵循了“不应该在操作符重载中修改操作数”的原则。如果使用了这个版本的自增重载，在上述后缀式自增的例子中，会和我们预期的一样：instance1的Number是2，而instance1的Number是1。我想，在很多情况下（特别是当SomeType是值类型时），这会是您希望得到的结果，也同样是您代码的消费者所预期的结果。

总结一下，对于自增和自减操作符，我们这样理解可能会更容易一些：执行语句 `instance2 = instance1++;`时，会先将instance1的值赋给instance2，再计算出instance1的自增重载函数的返回值后赋给instance1。注意：自增重载方法的返回值是用来赋值给调用该重载方法的操作数的！
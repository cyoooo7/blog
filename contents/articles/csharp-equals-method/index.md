---
title: C#初学者对Equals方法的4个常见误解
author: Roy Cheng
date: 2011-06-08 09:23
template: article.jade
---

很多C#的教材都会强调对象相等的概念。我们都知道，在C#的世界里存在两种等同性。一种是逻辑等同性：如果两个对象在逻辑上代表同样的值，则称他们具有逻辑等同性。另一种是引用等同性：如果两个引用指向同一个对象实例，则称他们具有引用等同性。

<span class="more"></span>

众所周知，Object类型有一个名为Equals的实例方法可以用来确定两个对象是否相等。Object的Equals的默认实现比较的是两个对象的引用等同性。而Object的派生类ValueTpye重写了Equals方法，它比较的是两个对象的逻辑等同性。也就是说，在C#里，引用类型的默认Equals版本关注的是引用等同性，而值类型关注的是逻辑等同性。当然，这并不总能满足我们的要求。所以每当我们更在意引用类型的逻辑等同性的时候，我们就应该重写Equals方法。

重写引用类型的Equals方法以改变其默认的比较方式的一个著名例子是String类。当我们写出 `string1.Equals(string2)` 这样的代码时，我们比较的不是string1和string2这两个引用所指向的是否为同一个实例（引用等同性），而是比较string1与string2所包含的字符序列是否相同（逻辑等同性）。

### 误解一：Equals方法和operator==具有相同的默认行为

对于引用类型，如果没有为它重载==操作符，且其父类型也没有重写Equals方法，则这个引用类型Equals方法和operator==具有相同的默认行为，即它们比较的都是对象的引用等同性。然而对于值类型来说，就完全不是这么回事了！因为如果你没有为自定义值类型重载operator==的话，就不能写这样的代码 `myStruct1 == myStruct2`，否则会得到一个编译错误，原因是值类型没有相等操作符重载的默认实现。

### 误解二：自定义类的Equals的方法默认实现将自动调用operator==方法，或operator==方法的默认实现将自动调用Equals方法

经常听到有人说某某类型是引用类型，所以它的Equals方法的默认实现将自动调用operator==方法。这种说法完全是没有道理的。正如上文所说的，引用类型Equals方法的默认实现来自Object，而值类型的默认实现来自TypeValue，就算他们会使用==操作符，使用的也是Object或TypeValue的重载版本。原则上来说，只要我们没有重写一个类的Equals方法，那么它就会继承其父类的实现，而父类是没有机会使用子类型的操作符重载的。同样，只要我们没有在一个类的==操作符重载中调用Equals方法，它是不会自动调用的。

### 误解三：值类型的默认Equals实现是对两个对象进行逐位比较的

有些人认为值类型的Equals默认实现就是通过比较两个对象在内存中的位表示，即如果所有的二进制位都相等，则说明这两个对象“等同”。这是不准确的。因为其实值类型的Equals默认实现是对值类型的每个字段都调用该字段类型的Equals方法，如果所有字段的Equals方法都返回true，则他们才可能相等。来看一个例子：

``` C++
class MyClass
{
    public override bool Equals(object obj)
    {
        Console.WriteLine("MyClass的Equals方法被调用了。");
        return true;
    }
}

struct MyStruct
{
    public MyClass Filed;
}

class Program
{
    static void Main(string[] args)
    {
        MyStruct a;
        MyStruct b;
        a.Filed = new MyClass();
        b.Filed = new MyClass();
        Console.WriteLine(a.Equals(b));
    }
｝
```

很显然，a和b拥有完全不同的二进制位表示。但是最终打印的结果是：

``` text
MyClass的Equals方法被调用了。
True
``` 

这说明值类型的默认实现是通过调用字段的Equals方法来确定两个对象是否相等，而不是通过比较他们的二进制位是否一致来确定的。

###     误解四：Equals是非常基本、非常常用的方法，所以其默认的实现不存在性能问题

对于引用类型，Equals的默认实现很简单，仅仅需要判断两个引用是不是同一种类型、两个引用指向的是不是同一块内存就可以了。所以其性能也没有问题。但是对于值类型，Equals的任务就没有这么简单了。它需要对两个对象的所有字段都做出比较，即逐字段调用字段类型的Equals。由于在ValueType（值类型Equals方法默认实现的位置）中，不可能知道它所有的子类型都包含哪些字段，所以为了调用子类型字段的Equals方法，ValueType的Equals就需要使用反射技术。您可能已经看出来了，反射并不是一种性能友好的技术，所以值类型的Equals方法算不上高效。这也正是为什么微软推荐我们为自定义值类型重写Equals方法的原因。